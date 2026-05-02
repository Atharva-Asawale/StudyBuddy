package com.studybuddy.backend.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RagService {


    private static final Set<String> STOPWORDS = new HashSet<>(Arrays.asList(
        "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now", "chapter", "section", "page", "figure", "table", "example", "exercise", "problem", "solution", "university", "department", "professor", "edition", "copyright", "all", "rights", "reserved"
    ));

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".pdf")) {
            try (PDDocument doc = PDDocument.load(file.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                return stripper.getText(doc);
            }
        } else if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
            try (XWPFDocument doc = new XWPFDocument(file.getInputStream());
                 XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                return extractor.getText();
            }
        } else {
            throw new IllegalArgumentException("Unsupported file type. Please upload a PDF or DOCX file.");
        }
    }

    public List<Map<String, String>> extractCoreFacts(String text) {
        Map<String, Integer> freq = new HashMap<>();
        String[] tokens = text.toLowerCase().split("[^a-zA-Z]+");
        
        for (String t : tokens) {
            if (t.length() > 3 && !STOPWORDS.contains(t)) {
                freq.put(t, freq.getOrDefault(t, 0) + 1);
            }
        }

        List<String> topKeywords = freq.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(15)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        List<Map<String, String>> facts = new ArrayList<>();
        String[] sentences = text.split("(?<=[.!?])\\s+");

        for (String keyword : topKeywords) {
            for (String sentence : sentences) {
                if (sentence.toLowerCase().contains(keyword)) {
                    Map<String, String> fact = new HashMap<>();
                    fact.put("concept", keyword);
                    fact.put("definition", sentence.trim());
                    facts.add(fact);
                    break;
                }
            }
        }
        return facts;
    }

    public String getSelectedChunks(String text, List<Map<String, String>> knowledgeMap) {
        String cleanedText = text.trim().replaceAll("\\s+", " ");
        String[] words = cleanedText.split("\\s+");
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        int wordCount = 0;
        for (String word : words) {
            currentChunk.append(word).append(" ");
            wordCount++;
            if (wordCount >= 300) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder();
                wordCount = 0;
            }
        }
        if (currentChunk.length() > 0) chunks.add(currentChunk.toString().trim());

        if (chunks.size() <= 9) return String.join("\n\n---\n\n", chunks);

        Set<String> keywords = knowledgeMap.stream()
                .map(m -> m.get("concept"))
                .collect(Collectors.toSet());

        List<Integer> scores = new ArrayList<>();
        for (String chunk : chunks) {
            int score = 0;
            String lower = chunk.toLowerCase();
            for (String k : keywords) {
                if (lower.contains(k)) score++;
            }
            scores.add(score);
        }

        int third = chunks.size() / 3;
        List<String> selected = new ArrayList<>();
        selected.addAll(pickTopFromRange(chunks, scores, 0, third, 3));
        selected.addAll(pickTopFromRange(chunks, scores, third, 2 * third, 3));
        selected.addAll(pickTopFromRange(chunks, scores, 2 * third, chunks.size(), 3));

        return String.join("\n\n---\n\n", selected);
    }

    private List<String> pickTopFromRange(List<String> chunks, List<Integer> scores, int start, int end, int count) {
        List<Integer> indices = new ArrayList<>();
        for (int i = start; i < end; i++) indices.add(i);

        return indices.stream()
                .sorted((a, b) -> Integer.compare(scores.get(b), scores.get(a)))
                .limit(count)
                .map(chunks::get)
                .collect(Collectors.toList());
    }
}
