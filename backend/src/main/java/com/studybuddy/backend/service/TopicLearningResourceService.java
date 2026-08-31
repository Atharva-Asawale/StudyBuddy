package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO.VideoItem;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO.WebItem;
import com.studybuddy.backend.dto.TopicLearningResourcesDTO.PdfItem;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.TopicProgressRepository;
import com.studybuddy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.*;

/**
 * Orchestrates personalized learning resources curation for a chapter.
 * Runs searches concurrently, filters/validates URLs, sends candidates
 * to Gemini for ranking, and returns the final mapped categories.
 */
@Service
@RequiredArgsConstructor
public class TopicLearningResourceService {

    private final UserRepository userRepository;
    private final SyllabusNodeRepository syllabusNodeRepository;
    private final TopicProgressRepository topicProgressRepository;
    private final TopicResourceSearchService resourceSearchService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @Transactional(readOnly = true)
    public TopicLearningResourcesDTO getChapterResources(String email, UUID chapterId) {
        User user = findUser(email);
        SyllabusNode chapterNode = syllabusNodeRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found: " + chapterId));

        String subjectName = chapterNode.getParent() != null ? chapterNode.getParent().getName() : null;
        Integer semester = chapterNode.getSemester() != null ? chapterNode.getSemester() : (user.getCurrentSemester() != null ? user.getCurrentSemester() : 1);
        String branch = chapterNode.getBranch() != null ? chapterNode.getBranch() : (user.getBranch() != null ? user.getBranch() : "Engineering");

        // Fetch subtopics context
        List<SyllabusNode> childTopics = syllabusNodeRepository.findByParentId(chapterId);
        BigDecimal totalScore = BigDecimal.ZERO;
        int progressCount = 0;
        List<String> subtopicNames = new ArrayList<>();

        for (SyllabusNode topic : childTopics) {
            subtopicNames.add(topic.getName());
            Optional<TopicProgress> progressOpt = topicProgressRepository.findByUserAndTopic(user, topic);
            if (progressOpt.isPresent() && progressOpt.get().getScore() != null) {
                totalScore = totalScore.add(progressOpt.get().getScore());
                progressCount++;
            }
        }

        BigDecimal score = null;
        if (progressCount > 0) {
            score = totalScore.divide(BigDecimal.valueOf(progressCount), 2, RoundingMode.HALF_UP);
        }

        String status;
        if (score != null) {
            if (score.compareTo(BigDecimal.valueOf(60)) < 0) {
                status = "WEAK";
            } else if (score.compareTo(BigDecimal.valueOf(80)) < 0) {
                status = "AT_RISK";
            } else {
                status = "STRONG";
            }
        } else {
            status = "AT_RISK";
        }

        // Parallel Fetch of raw candidates
        ExecutorService executor = Executors.newFixedThreadPool(3);
        Future<List<VideoItem>> videoFuture = executor.submit(() ->
                resourceSearchService.searchYouTubeVideos(chapterNode.getName(), subjectName));
        Future<List<WebItem>> webFuture = executor.submit(() ->
                resourceSearchService.searchTinyFishWeb(chapterNode.getName(), subjectName));
        Future<List<PdfItem>> pdfFuture = executor.submit(() ->
                resourceSearchService.searchTinyFishPdf(chapterNode.getName(), subjectName));

        List<VideoItem> rawVideos = Collections.emptyList();
        List<WebItem> rawWebs = Collections.emptyList();
        List<PdfItem> rawPdfs = Collections.emptyList();

        try {
            rawVideos = videoFuture.get(20, TimeUnit.SECONDS);
            rawWebs = webFuture.get(20, TimeUnit.SECONDS);
            rawPdfs = pdfFuture.get(20, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("Error fetching candidates concurrently: " + e.getMessage());
        } finally {
            executor.shutdown();
        }

        // Enrich and validate web candidates via TinyFish Fetch concurrently
        List<WebItem> validatedWebs = Collections.synchronizedList(new ArrayList<>());
        if (!rawWebs.isEmpty()) {
            ExecutorService fetchPool = Executors.newCachedThreadPool();
            List<Future<?>> fetchFutures = new ArrayList<>();
            for (WebItem candidate : rawWebs) {
                fetchFutures.add(fetchPool.submit(() -> {
                    resourceSearchService.fetchAndValidateWeb(candidate)
                            .ifPresent(validatedWebs::add);
                }));
            }
            for (Future<?> f : fetchFutures) {
                try { f.get(25, TimeUnit.SECONDS); } catch (Exception ignored) {}
            }
            fetchPool.shutdown();
        }

        // Limit candidates to up to 5 distinct valid candidates per category before Gemini
        List<VideoItem> finalVideos = rawVideos.stream().limit(5).toList();
        List<WebItem> finalWebs = validatedWebs.stream().limit(5).toList();
        List<PdfItem> finalPdfs = rawPdfs.stream().limit(5).toList();

        // Build candidate maps for Gemini ranking resolution
        Map<String, Object> candidateLookup = new HashMap<>();
        finalVideos.forEach(v -> candidateLookup.put(v.getId(), v));
        finalWebs.forEach(w -> candidateLookup.put(w.getId(), w));
        finalPdfs.forEach(p -> candidateLookup.put(p.getId(), p));

        // Format candidate JSON for Gemini ranking
        ObjectNode candidateJsonRoot = objectMapper.createObjectNode();
        ArrayNode subtopicsArray = candidateJsonRoot.putArray("subtopics");
        subtopicNames.forEach(subtopicsArray::add);

        ArrayNode videosArray = candidateJsonRoot.putArray("videos");
        for (VideoItem v : finalVideos) {
            ObjectNode obj = videosArray.addObject();
            obj.put("id", v.getId());
            obj.put("title", v.getTitle());
            obj.put("creator", v.getChannel());
            obj.put("description", v.getDescription());
        }

        ArrayNode websArray = candidateJsonRoot.putArray("webResources");
        for (WebItem w : finalWebs) {
            ObjectNode obj = websArray.addObject();
            obj.put("id", w.getId());
            obj.put("title", w.getTitle());
            obj.put("source", w.getSource());
            obj.put("description", w.getDescription());
        }

        ArrayNode pdfsArray = candidateJsonRoot.putArray("pdfs");
        for (PdfItem p : finalPdfs) {
            ObjectNode obj = pdfsArray.addObject();
            obj.put("id", p.getId());
            obj.put("title", p.getTitle());
            obj.put("source", p.getSource());
            obj.put("description", p.getDescription());
        }

        // Perform single Gemini Personalization & Ranking call
        GeminiService.TopicResourceAiRankingResult aiResult = geminiService.personalizeAndRankTopicResources(
                branch,
                semester,
                chapterNode.getName(),
                score != null ? score.doubleValue() : 50.0,
                status,
                candidateJsonRoot.toString()
        );

        Set<String> rankedIds = new HashSet<>();
        if (aiResult != null && aiResult.getRecommendations() != null) {
            for (GeminiService.TopicResourceAiRankingResult.RankedItem rec : aiResult.getRecommendations()) {
                if (rec == null || rec.getResourceId() == null) continue;
                String rId = rec.getResourceId().trim();
                Object original = candidateLookup.get(rId);
                if (original != null && !rankedIds.contains(rId)) {
                    if (original instanceof VideoItem v) {
                        v.setReason(rec.getReason());
                        v.setRank(rec.getRank() != null ? rec.getRank() : 99);
                    } else if (original instanceof WebItem w) {
                        w.setReason(rec.getReason());
                        w.setRank(rec.getRank() != null ? rec.getRank() : 99);
                    } else if (original instanceof PdfItem p) {
                        p.setReason(rec.getReason());
                        p.setRank(rec.getRank() != null ? rec.getRank() : 99);
                    }
                    rankedIds.add(rId);
                }
            }
        }

        // Handle fallback ranks and reasons
        assignFallbackRanksVideo(finalVideos);
        assignFallbackRanksWeb(finalWebs);
        assignFallbackRanksPdf(finalPdfs);

        // Sort and select up to 3 final ranked items per category
        List<VideoItem> sortedVideos = new ArrayList<>(finalVideos);
        sortedVideos.sort(Comparator.comparing(VideoItem::getRank, Comparator.nullsLast(Integer::compareTo)));
        List<VideoItem> responseVideos = sortedVideos.stream().limit(3).toList();

        List<WebItem> sortedWebs = new ArrayList<>(finalWebs);
        sortedWebs.sort(Comparator.comparing(WebItem::getRank, Comparator.nullsLast(Integer::compareTo)));
        List<WebItem> responseWebs = sortedWebs.stream().limit(3).toList();

        List<PdfItem> sortedPdfs = new ArrayList<>(finalPdfs);
        sortedPdfs.sort(Comparator.comparing(PdfItem::getRank, Comparator.nullsLast(Integer::compareTo)));
        List<PdfItem> responsePdfs = sortedPdfs.stream().limit(3).toList();

        // Build Response DTO
        TopicLearningResourcesDTO dto = new TopicLearningResourcesDTO();
        dto.setTopicId(chapterNode.getId().toString());
        dto.setTopicName(chapterNode.getName());
        dto.setScore(score);
        dto.setStatus(status);
        dto.setSubject(subjectName);
        dto.setSemester(semester);
        dto.setOverallInsight(aiResult != null && aiResult.getOverallInsight() != null
                ? aiResult.getOverallInsight()
                : "Curated learning resources tailored to help you master the " + chapterNode.getName() + " chapter.");

        dto.setVideos(responseVideos);
        dto.setWebResources(responseWebs);
        dto.setPdfs(responsePdfs);

        return dto;
    }

    private void assignFallbackRanksVideo(List<VideoItem> list) {
        int r = 1;
        for (VideoItem item : list) {
            if (item.getRank() == null) item.setRank(r);
            if (item.getReason() == null || item.getReason().isBlank()) {
                item.setReason("Recommended video lecture to visualize core conceptual mechanisms.");
            }
            r++;
        }
    }

    private void assignFallbackRanksWeb(List<WebItem> list) {
        int r = 1;
        for (WebItem item : list) {
            if (item.getRank() == null) item.setRank(r);
            if (item.getReason() == null || item.getReason().isBlank()) {
                item.setReason("Curated web guide covering topic explanations and core definitions.");
            }
            r++;
        }
    }

    private void assignFallbackRanksPdf(List<PdfItem> list) {
        int r = 1;
        for (PdfItem item : list) {
            if (item.getRank() == null) item.setRank(r);
            if (item.getReason() == null || item.getReason().isBlank()) {
                item.setReason("Academic text or lecture PDF for detailed conceptual reinforcement.");
            }
            r++;
        }
    }
}
