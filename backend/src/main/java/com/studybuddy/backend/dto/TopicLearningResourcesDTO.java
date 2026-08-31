package com.studybuddy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for the personalized learning resources response.
 * <p>
 * Resources are split into three categories:
 *  - videos     : YouTube Data API v3 results
 *  - webResources : TinyFish Search/Fetch web pages
 *  - pdfs       : TinyFish Search PDF results
 * <p>
 * No resources are stored in PostgreSQL; this is generated live and cached
 * in the browser sessionStorage under the key learning_resources_${chapterId}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopicLearningResourcesDTO {

    private String topicId;
    private String topicName;
    private BigDecimal score;
    private String status; // WEAK, AT_RISK, STRONG
    private String subject;
    private Integer semester;
    private String overallInsight;

    // ── Resource Categories ───────────────────────────────────────────────
    private List<VideoItem>  videos       = new ArrayList<>();
    private List<WebItem>    webResources = new ArrayList<>();
    private List<PdfItem>    pdfs         = new ArrayList<>();

    // ── Video (YouTube) ───────────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoItem {
        private String id;           // yt_<videoId>
        private String title;
        private String url;          // https://www.youtube.com/watch?v=<videoId>
        private String channel;      // channel name
        private String thumbnailUrl;
        private String description;
        private String reason;       // Gemini personalized reason
        private Integer rank;
    }

    // ── Web Resource (TinyFish web pages) ────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WebItem {
        private String id;           // tf_web_<hash>
        private String title;
        private String url;
        private String source;       // domain / site_name
        private String description;
        private String reason;       // Gemini personalized reason
        private Integer rank;
    }

    // ── PDF (TinyFish PDF results) ────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PdfItem {
        private String id;           // tf_pdf_<hash>
        private String title;
        private String url;
        private String source;       // domain / site_name
        private String description;
        private String reason;       // Gemini personalized reason
        private Integer rank;
        private boolean isPdf = true;
    }
}
