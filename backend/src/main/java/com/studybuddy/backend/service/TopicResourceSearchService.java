package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO.VideoItem;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO.WebItem;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO.PdfItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/**
 * Discovers candidate learning resources from external providers:
 *  - YouTube Data API v3   → video candidates (ONE search.list call, maxResults=5)
 *  - TinyFish Search API   → web and PDF candidates (multiple concurrent queries)
 *  - TinyFish Fetch API    → enriches promising web candidates with page content
 *
 * Authentication:
 *  - YouTube : API key in query string (standard Google API convention)
 *  - TinyFish: X-API-Key header (official TinyFish specification)
 *
 * This service does NOT call Gemini. Ranking and personalization are done by
 * TopicLearningResourceService after candidate filtering.
 *
 * No Google Books or Internet Archive code exists in this file.
 * No resource content is stored in PostgreSQL.
 */
@Service
public class TopicResourceSearchService {

    @Value("${youtube.api.key:}")
    private String youtubeApiKey;

    @Value("${tinyfish.api.key:}")
    private String tinyfishApiKey;

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ─────────────────────────────────────────────────────────────────────
    // YOUTUBE  (ONE request, maxResults=5)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * One YouTube search.list request with maxResults=5.
     * Filters out non-English titles and Shorts.
     */
    public List<VideoItem> searchYouTubeVideos(String chapterName, String subjectName) {
        List<VideoItem> results = new ArrayList<>();
        if (youtubeApiKey == null || youtubeApiKey.isBlank()) {
            System.err.println("[YouTube] API key not configured — skipping video search.");
            return results;
        }

        try {
            // Build a targeted educational query
            String searchQuery = buildYouTubeQuery(chapterName, subjectName);
            String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);
            String url = "https://www.googleapis.com/youtube/v3/search"
                    + "?part=snippet"
                    + "&type=video"
                    + "&maxResults=5"
                    + "&videoDuration=medium"      // exclude Shorts (< 4 min)
                    + "&relevanceLanguage=en"
                    + "&q=" + encodedQuery
                    + "&key=" + youtubeApiKey.trim();

            String response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            if (response == null || response.isBlank()) return results;

            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("items");
            if (!items.isArray()) return results;

            for (JsonNode item : items) {
                String videoId = item.path("id").path("videoId").asText(null);
                if (videoId == null || videoId.isBlank()) continue;

                JsonNode snippet = item.path("snippet");
                String title       = snippet.path("title").asText("").trim();
                String channel     = snippet.path("channelTitle").asText("YouTube");
                String description = snippet.path("description").asText("").trim();
                String thumbnail   = snippet.path("thumbnails").path("medium").path("url").asText(
                        snippet.path("thumbnails").path("default").path("url").asText(null));

                // Basic English filter on title
                if (!isLikelyEnglish(title)) continue;
                // Reject obvious clickbait/non-educational keywords
                if (isRejectedVideoTitle(title)) continue;

                VideoItem video = new VideoItem();
                video.setId("yt_" + videoId);
                video.setTitle(title);
                video.setUrl("https://www.youtube.com/watch?v=" + videoId);
                video.setChannel(channel);
                video.setThumbnailUrl(thumbnail);
                video.setDescription(description.length() > 300 ? description.substring(0, 300) : description);
                results.add(video);
            }
        } catch (Exception e) {
            System.err.println("[YouTube] Search failed: " + e.getMessage());
        }

        return results;
    }

    // ─────────────────────────────────────────────────────────────────────
    // TINYFISH SEARCH  (GET https://api.search.tinyfish.ai)
    // Auth: X-API-Key header  |  No maxResults parameter in their API
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Searches for web-learning resources (tutorials, course pages, university lectures)
     * using multiple targeted queries concurrently.
     * Returns up to 5 distinct web candidates.
     */
    public List<WebItem> searchTinyFishWeb(String chapterName, String subjectName) {
        if (tinyfishApiKey == null || tinyfishApiKey.isBlank()) {
            System.err.println("[TinyFish] API key not configured — skipping web search.");
            return Collections.emptyList();
        }

        List<String> queries = buildWebQueries(chapterName, subjectName);
        return collectWebResults(queries, 5);
    }

    /**
     * Searches for PDF educational resources using multiple targeted queries concurrently.
     * Returns up to 5 distinct PDF candidates.
     */
    public List<PdfItem> searchTinyFishPdf(String chapterName, String subjectName) {
        if (tinyfishApiKey == null || tinyfishApiKey.isBlank()) {
            System.err.println("[TinyFish] API key not configured — skipping PDF search.");
            return Collections.emptyList();
        }

        List<String> queries = buildPdfQueries(chapterName, subjectName);
        return collectPdfResults(queries, 5);
    }

    // ─────────────────────────────────────────────────────────────────────
    // TINYFISH FETCH  (POST https://api.fetch.tinyfish.ai)
    // Auth: X-API-Key header  |  Body: { "urls": [...], "format": "markdown" }
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Fetches a single URL with TinyFish Fetch and enriches the WebItem with
     * real page content (description, language detection, paywall detection).
     * Returns an Optional containing the enriched item, or empty if rejected.
     */
    public Optional<WebItem> fetchAndValidateWeb(WebItem candidate) {
        if (tinyfishApiKey == null || tinyfishApiKey.isBlank()) return Optional.of(candidate);
        try {
            // Build JSON body per TinyFish Fetch API spec:
            // POST https://api.fetch.tinyfish.ai
            // Headers: X-API-Key, Content-Type: application/json
            // Body: { "urls": ["..."], "format": "markdown", "per_url_timeout_ms": 20000 }
            com.fasterxml.jackson.databind.node.ObjectNode bodyNode = objectMapper.createObjectNode();
            bodyNode.putArray("urls").add(candidate.getUrl());
            bodyNode.put("format", "markdown");
            bodyNode.put("per_url_timeout_ms", 20000);
            String body = objectMapper.writeValueAsString(bodyNode);

            String response = restClient.post()
                    .uri("https://api.fetch.tinyfish.ai")
                    .header("X-API-Key", tinyfishApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (response == null || response.isBlank()) return Optional.of(candidate);

            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.path("results");

            if (!results.isArray() || results.isEmpty()) {
                // Check errors — login_required, bot_blocked → reject
                JsonNode errors = root.path("errors");
                if (errors.isArray() && !errors.isEmpty()) {
                    String errorCode = errors.get(0).path("error").asText("");
                    if (errorCode.equals("login_required") || errorCode.equals("bot_blocked")) {
                        return Optional.empty();
                    }
                }
                return Optional.of(candidate); // no content but not explicitly rejected
            }

            JsonNode page = results.get(0);
            String language = page.path("language").asText("en");
            String description = page.path("description").asText("").trim();
            String text = page.path("text").asText("").trim();
            String title = page.path("title").asText("").trim();

            // Strict English check
            if (language != null && !language.isBlank() && !language.startsWith("en")) {
                return Optional.empty();
            }

            // Paywall / login-wall detection in fetched content
            if (isPaywalled(text)) return Optional.empty();

            // Enrich the candidate
            if (!title.isBlank() && candidate.getTitle().isBlank()) candidate.setTitle(title);
            if (!description.isBlank()) {
                candidate.setDescription(description.length() > 300
                        ? description.substring(0, 300) : description);
            } else if (!text.isBlank()) {
                String snippet = text.length() > 300 ? text.substring(0, 300) : text;
                candidate.setDescription(snippet.replaceAll("\\s+", " ").trim());
            }

            return Optional.of(candidate);

        } catch (Exception e) {
            System.err.println("[TinyFish Fetch] Failed for " + candidate.getUrl() + ": " + e.getMessage());
            return Optional.of(candidate); // don't hard-fail — still include if URL looks valid
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // INTERNAL: TINYFISH SEARCH EXECUTION
    // ─────────────────────────────────────────────────────────────────────

    private List<WebItem> collectWebResults(List<String> queries, int maxTotal) {
        Set<String> seenUrls = ConcurrentHashMap.newKeySet();
        List<WebItem> all = Collections.synchronizedList(new ArrayList<>());
        ExecutorService pool = Executors.newCachedThreadPool();
        List<Future<?>> futures = new ArrayList<>();

        for (String query : queries) {
            futures.add(pool.submit(() -> {
                List<WebItem> batch = executeTinyFishWebSearch(query);
                for (WebItem item : batch) {
                    if (seenUrls.add(item.getUrl())) {
                        all.add(item);
                    }
                }
            }));
        }
        awaitAll(futures);
        pool.shutdown();
        return all.stream().limit(maxTotal).toList();
    }

    private List<PdfItem> collectPdfResults(List<String> queries, int maxTotal) {
        Set<String> seenUrls = ConcurrentHashMap.newKeySet();
        List<PdfItem> all = Collections.synchronizedList(new ArrayList<>());
        ExecutorService pool = Executors.newCachedThreadPool();
        List<Future<?>> futures = new ArrayList<>();

        for (String query : queries) {
            futures.add(pool.submit(() -> {
                List<PdfItem> batch = executeTinyFishPdfSearch(query);
                for (PdfItem item : batch) {
                    if (seenUrls.add(item.getUrl())) {
                        all.add(item);
                    }
                }
            }));
        }
        awaitAll(futures);
        pool.shutdown();
        return all.stream().limit(maxTotal).toList();
    }

    private List<WebItem> executeTinyFishWebSearch(String query) {
        List<WebItem> results = new ArrayList<>();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://api.search.tinyfish.ai?query=" + encodedQuery + "&language=en&location=US";

            String response = restClient.get()
                    .uri(url)
                    .header("X-API-Key", tinyfishApiKey.trim())
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(String.class);

            if (response == null || response.isBlank()) return results;
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("results");
            if (!items.isArray()) return results;

            for (JsonNode item : items) {
                String itemUrl = item.path("url").asText("").trim();
                String title   = item.path("title").asText("").trim();
                String snippet = item.path("snippet").asText("").trim();
                String domain  = item.path("site_name").asText("").trim();

                if (itemUrl.isBlank() || title.isBlank()) continue;
                if (!itemUrl.startsWith("http")) continue;
                // Skip PDF URLs — those belong in the PDF category
                if (itemUrl.toLowerCase().endsWith(".pdf")) continue;
                if (!isLikelyEnglish(title + " " + snippet)) continue;
                if (isRejectedWebDomain(itemUrl)) continue;
                if (hasPaywallSignals(title, snippet)) continue;

                String id = "tf_web_" + Integer.toHexString((itemUrl).hashCode());
                WebItem wi = new WebItem();
                wi.setId(id);
                wi.setTitle(title);
                wi.setUrl(itemUrl);
                wi.setSource(domain.isBlank() ? extractDomain(itemUrl) : domain);
                wi.setDescription(snippet.length() > 300 ? snippet.substring(0, 300) : snippet);
                results.add(wi);
            }
        } catch (Exception e) {
            System.err.println("[TinyFish Search Web] Query failed: " + e.getMessage());
        }
        return results;
    }

    private List<PdfItem> executeTinyFishPdfSearch(String query) {
        List<PdfItem> results = new ArrayList<>();
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://api.search.tinyfish.ai?query=" + encodedQuery + "&language=en&location=US";

            String response = restClient.get()
                    .uri(url)
                    .header("X-API-Key", tinyfishApiKey.trim())
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(String.class);

            if (response == null || response.isBlank()) return results;
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("results");
            if (!items.isArray()) return results;

            for (JsonNode item : items) {
                String itemUrl = item.path("url").asText("").trim();
                String title   = item.path("title").asText("").trim();
                String snippet = item.path("snippet").asText("").trim();
                String domain  = item.path("site_name").asText("").trim();

                if (itemUrl.isBlank() || title.isBlank()) continue;
                if (!itemUrl.startsWith("http")) continue;
                // Only accept .pdf URLs or strong PDF signals in title/snippet
                boolean isPdfUrl = itemUrl.toLowerCase().endsWith(".pdf");
                boolean hasPdfSignal = snippet.toLowerCase().contains("pdf")
                        || title.toLowerCase().contains("lecture notes")
                        || title.toLowerCase().contains("course notes")
                        || title.toLowerCase().contains("[pdf]");
                if (!isPdfUrl && !hasPdfSignal) continue;
                if (!isLikelyEnglish(title + " " + snippet)) continue;
                if (isRejectedWebDomain(itemUrl)) continue;

                String id = "tf_pdf_" + Integer.toHexString((itemUrl).hashCode());
                PdfItem pi = new PdfItem();
                pi.setId(id);
                pi.setTitle(title.replace("[PDF]", "").replace("[pdf]", "").trim());
                pi.setUrl(itemUrl);
                pi.setSource(domain.isBlank() ? extractDomain(itemUrl) : domain);
                pi.setDescription(snippet.length() > 300 ? snippet.substring(0, 300) : snippet);
                pi.setPdf(true);
                results.add(pi);
            }
        } catch (Exception e) {
            System.err.println("[TinyFish Search PDF] Query failed: " + e.getMessage());
        }
        return results;
    }

    // ─────────────────────────────────────────────────────────────────────
    // QUERY BUILDERS
    // ─────────────────────────────────────────────────────────────────────

    private String buildYouTubeQuery(String chapter, String subject) {
        String base = chapter.trim();
        if (subject != null && !subject.isBlank()) base += " " + subject.trim();
        return base + " lecture tutorial english";
    }

    private List<String> buildWebQueries(String chapter, String subject) {
        String ch = chapter.trim();
        return List.of(
            "\"" + ch + "\" free English tutorial",
            "\"" + ch + "\" free English course",
            "\"" + ch + "\" university lecture notes",
            "\"" + ch + "\" educational tutorial"
        );
    }

    private List<String> buildPdfQueries(String chapter, String subject) {
        String ch = chapter.trim();
        return List.of(
            "\"" + ch + "\" lecture notes PDF",
            "\"" + ch + "\" free English educational PDF",
            "\"" + ch + "\" university course notes PDF",
            "\"" + ch + "\" filetype:pdf"
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // VALIDATION HELPERS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Heuristic English check: looks for a mix of common English stop-words and
     * the absence of predominantly non-Latin characters.
     */
    public boolean isLikelyEnglish(String text) {
        if (text == null || text.isBlank()) return true; // don't auto-reject
        String lower = text.toLowerCase();
        // Reject if majority of characters are non-Latin (CJK, Devanagari, Arabic…)
        long nonLatin = text.chars()
                .filter(c -> c > 0x024F && c != '\'' && c != '"' && c != '-' && c != ' ')
                .count();
        if (nonLatin > text.length() * 0.3) return false;
        return true;
    }

    /** Detects paywall/login signals in the fetched page text. */
    private boolean isPaywalled(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        return lower.contains("sign in to view") || lower.contains("subscribe to read")
                || lower.contains("create an account to continue") || lower.contains("paywall")
                || lower.contains("premium content") || lower.contains("login to access")
                || lower.contains("members only") || lower.contains("paid subscription");
    }

    /** Detects paywall/login signals in title/snippet metadata (lighter check). */
    private boolean hasPaywallSignals(String title, String snippet) {
        String combined = (title + " " + snippet).toLowerCase();
        return combined.contains("subscribe now") || combined.contains("sign up to read")
                || combined.contains("premium") && combined.contains("only");
    }

    private boolean isRejectedVideoTitle(String title) {
        if (title == null) return false;
        String lower = title.toLowerCase();
        return lower.contains("clickbait") || lower.contains("reacts to")
                || lower.contains("#shorts") || lower.contains("shorts");
    }

    private boolean isRejectedWebDomain(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        // Reject known piracy / spam / irrelevant domains
        return lower.contains("pinterest.") || lower.contains("facebook.com/")
                || lower.contains("instagram.com/") || lower.contains("tiktok.com")
                || lower.contains("amazon.com/") || lower.contains("ebay.com");
    }

    private String extractDomain(String url) {
        try {
            String host = new java.net.URL(url).getHost();
            return host.startsWith("www.") ? host.substring(4) : host;
        } catch (Exception e) {
            return url;
        }
    }

    private void awaitAll(List<Future<?>> futures) {
        for (Future<?> f : futures) {
            try { f.get(30, TimeUnit.SECONDS); }
            catch (Exception ignored) {}
        }
    }
}
