package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.AiSwotInputDTO;
import com.studybuddy.backend.dto.QuizQuestionDTO;
import com.studybuddy.backend.dto.SwotAnalysisDTO;
import com.studybuddy.backend.dto.LearningDebtGraphDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://generativelanguage.googleapis.com")
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    // Gemini 3.x stable Flash models (current documented fallback order).
    private final String[] MODELS = {
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-3.5-flash-lite"
    };

    public List<QuizQuestionDTO> generateQuiz(String topicName, String subjectName, int easy, int medium, int hard) {
        String prompt = buildPrompt(topicName, subjectName, easy, medium, hard);
        String requestBody = buildRequestBody(prompt);

        for (String model : MODELS) {
            try {
                System.out.println("Trying model: " + model);
                String response = restClient.post()
                        .uri("/v1beta/models/" + model + ":generateContent")
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", apiKey)
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);

                List<QuizQuestionDTO> questions = parseQuestions(response);
                if (questions != null && !questions.isEmpty()) {
                    System.out.println("Success with model: " + model);
                    return questions;
                }
            } catch (Exception e) {
                System.err.println("Model " + model + " failed: " + e.getMessage());
            }
        }

        System.err.println("All models failed, using fallback questions");
        return getFallbackQuestions(topicName);
    }

    public SwotAnalysisDTO generateSwotAnalysis(AiSwotInputDTO input) {
        if (apiKey == null || apiKey.isBlank() || input == null) {
            return null;
        }

        String prompt = """
                You are an academic and career advisor AI.

                Analyze the student data and generate a SWOT analysis.

                IMPORTANT:
                - Do NOT list raw topic names directly unless absolutely necessary.
                - Convert the data into meaningful patterns and insights.
                - Focus on understanding, consistency, practice behavior, and risk.
                - If totalTests < 5, clearly advise the student to attempt more tests.
                - Return ONLY valid JSON with this shape:
                {
                  "strengths": [],
                  "weaknesses": [],
                  "opportunities": [],
                  "threats": [],
                  "summary": ""
                }

                Student data:
                %s
                """.formatted(writeJson(input));

        String response = generatePlainText(prompt);
        return parseSwotAnalysis(response);
    }

    public String generateSwotSummary(List<String> strengths,
            List<String> weaknesses,
            List<String> opportunities,
            List<String> threats) {
        String prompt = """
                Write a short, encouraging SWOT summary for a student.
                Keep it under 90 words and mention only the provided points.

                Strengths: %s
                Weaknesses: %s
                Opportunities: %s
                Threats: %s
                """.formatted(strengths, weaknesses, opportunities, threats);

        String response = generatePlainText(prompt);
        if (response == null || response.isBlank()) {
            return buildFallbackSwotSummary(strengths, weaknesses, opportunities, threats);
        }
        return response.trim();
    }

    private String buildRequestBody(String prompt) {
        try {
            com.fasterxml.jackson.databind.node.ObjectNode requestBody = mapper.createObjectNode();
            com.fasterxml.jackson.databind.node.ArrayNode contents = requestBody.putArray("contents");
            com.fasterxml.jackson.databind.node.ObjectNode part = contents.addObject().putArray("parts").addObject();
            part.put("text", prompt);

            com.fasterxml.jackson.databind.node.ObjectNode config = requestBody.putObject("generationConfig");
            // Gemini 3.x: temperature/topP/topK/candidateCount are deprecated for these models.
            config.put("maxOutputTokens", 2048);
            // Gemini 3.x: thinkingLevel (replaces the legacy thinkingBudget) controls internal
            // reasoning depth. Thinking tokens count toward maxOutputTokens, so LOW keeps the
            // JSON responses complete within the existing 2048-token budget.
            config.putObject("thinkingConfig").put("thinkingLevel", "LOW");

            return mapper.writeValueAsString(requestBody);
        } catch (Exception e) {
            return "{}";
        }
    }

    public String generatePlainText(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        String requestBody = buildRequestBody(prompt);

        for (String model : MODELS) {
            try {
                String response = restClient.post()
                        .uri("/v1beta/models/" + model + ":generateContent")
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", apiKey)
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);

                JsonNode root = mapper.readTree(response);
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode parts = candidates.get(0).path("content").path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).path("text").asText();
                    }
                }
                System.err.println("Empty or blocked response from model: " + model);
            } catch (Exception e) {
                System.err.println("Model " + model + " error: " + e.getMessage());
            }
        }

        return null;
    }

    private String writeJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception exception) {
            return "{}";
        }
    }

    private SwotAnalysisDTO parseSwotAnalysis(String response) {
        if (response == null || response.isBlank()) {
            return null;
        }

        try {
            String text = response.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            }

            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                text = text.substring(start, end + 1);
            }

            SwotAnalysisDTO analysis = mapper.readValue(text, SwotAnalysisDTO.class);
            if (analysis.getStrengths() == null)
                analysis.setStrengths(new ArrayList<>());
            if (analysis.getWeaknesses() == null)
                analysis.setWeaknesses(new ArrayList<>());
            if (analysis.getOpportunities() == null)
                analysis.setOpportunities(new ArrayList<>());
            if (analysis.getThreats() == null)
                analysis.setThreats(new ArrayList<>());
            return analysis;
        } catch (Exception exception) {
            return null;
        }
    }

    private String buildPrompt(String topicName, String subjectName, int easy, int medium, int hard) {
        return """
                Generate a multiple choice quiz about "%s" from the subject "%s".

                Rules:
                - EXACTLY %d easy questions
                - EXACTLY %d medium questions
                - EXACTLY %d hard questions
                - Total questions: %d
                - QUESTION VARIETY: Include CASE STUDY based questions (scenarios), ANALYSIS based questions (comparisons/predictions), and some LENGTHY descriptive questions.
                - Each question must have exactly 4 options
                - Only one option is correct
                - Questions should be academic level for engineering students
                - Include a short, clear explanation for why the answer is correct.
                - Return ONLY valid JSON, no markdown, no extra text

                Format:
                [
                  {
                    "question": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctIndex": 0,
                    "difficulty": "easy",
                    "explanation": "Brief explanation..."
                  }
                ]
                """.formatted(topicName, subjectName, easy, medium, hard, (easy + medium + hard));
    }

    private List<QuizQuestionDTO> parseQuestions(String response) {
        try {
            JsonNode root = mapper.readTree(response);
            String text = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            text = text.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            }

            // Find JSON array in response
            int start = text.indexOf('[');
            int end = text.lastIndexOf(']');
            if (start >= 0 && end > start) {
                text = text.substring(start, end + 1);
            }

            JsonNode questionsNode = mapper.readTree(text);
            List<QuizQuestionDTO> questions = new ArrayList<>();

            for (JsonNode q : questionsNode) {
                QuizQuestionDTO dto = new QuizQuestionDTO();
                dto.setQuestion(q.path("question").asText());

                List<String> options = new ArrayList<>();
                for (JsonNode opt : q.path("options")) {
                    options.add(opt.asText());
                }
                dto.setOptions(options);
                dto.setCorrectIndex(q.path("correctIndex").asInt());
                dto.setDifficulty(q.path("difficulty").asText());
                dto.setExplanation(q.path("explanation").asText());

                if (!dto.getQuestion().isEmpty() && dto.getOptions().size() == 4) {
                    questions.add(dto);
                }
            }

            return questions;

        } catch (Exception e) {
            System.err.println("Parse error: " + e.getMessage());
            return null;
        }
    }

    private List<QuizQuestionDTO> getFallbackQuestions(String topicName) {
        List<QuizQuestionDTO> fallback = new ArrayList<>();
        String[][] qa = {
                { "What is the primary purpose of " + topicName + "?",
                        "Data storage", "Problem solving", "Code optimization", "Network communication", "1" },
                { "Which of the following best describes " + topicName + "?",
                        "A hardware component", "A software concept", "A network protocol", "A database type", "1" },
                { "" + topicName + " is most commonly used in which field?",
                        "Computer Science", "Biology", "Chemistry", "Physics", "0" },
                { "What is a key advantage of " + topicName + "?",
                        "Simplicity", "Efficiency", "Cost reduction", "Speed", "1" },
                { "Which concept is closely related to " + topicName + "?",
                        "Algorithms", "Hardware design", "Network topology", "Database schema", "0" },
        };
        for (String[] q : qa) {
            QuizQuestionDTO dto = new QuizQuestionDTO();
            dto.setQuestion(q[0]);
            dto.setOptions(List.of(q[1], q[2], q[3], q[4]));
            dto.setCorrectIndex(Integer.parseInt(q[5]));
            fallback.add(dto);
        }
        return fallback;
    }

    private String buildFallbackSwotSummary(List<String> strengths,
            List<String> weaknesses,
            List<String> opportunities,
            List<String> threats) {
        String strength = strengths.isEmpty() ? "your progress is still being established" : strengths.get(0);
        String weakness = weaknesses.isEmpty() ? "no major weak areas are visible yet" : weaknesses.get(0);
        String opportunity = opportunities.isEmpty() ? "keep attempting more topics to reveal new opportunities"
                : opportunities.get(0);
        String threat = threats.isEmpty() ? "there are no immediate threat signals right now" : threats.get(0);

        return "You are doing best where " + strength + " while " + weakness
                + ". A good next step is to focus on " + opportunity
                + ". Also watch out for " + threat + ".";
    }

    public List<LearningDebtGraphDTO.AffectedTopicDTO> analyzeLearningDebt(String topicName, String topicId,
            String studentBranch, int studentSemester, String futureTopicsJSON, double score) {
        if (apiKey == null || apiKey.isBlank()) {
            return new ArrayList<>();
        }

        String prompt = """
                You are the StudyBuddy AI Mentor, an expert in academic dependency mapping.

                Context:
                - Student Branch: %s
                - Current Semester: %d
                - Assessment Result: The student scored %.0f%% in "%s" (ID: %s).
                - Assessment Meaning: A score below 60%% indicates a fundamental weakness that will cause 'Learning Debt' in future complex topics.

                Input Data (Future Topics):
                %s

                Your Task:
                Identify exactly 2 or 3 topics from the "Future Topics" list above that have a DIRECT dependency on the concepts in "%s".
                For example, if the weakness is in "Differentiation", an affected topic might be "Integration".

                Strict Rules:
                1. SELECT topics ONLY from the provided Future Topics list.
                2. USE the exact "id" provided in the list for each selected topic.
                3. DO NOT invent new topics. If no strong dependencies exist, return an empty array.
                4. PROVIDE a concise, one-sentence academic reason for the dependency.
                5. RETURN ONLY a raw JSON array. NO markdown blocks (```json), NO preamble, NO extra text.

                Required JSON Format:
                [
                  {
                    "id": "uuid-from-list",
                    "name": "Topic Name",
                    "reason": "Clear explanation of how knowledge of %s is required here."
                  }
                ]
                """
                .formatted(studentBranch, studentSemester, score, topicName, topicId, futureTopicsJSON, topicName,
                        topicName);

        String response = generatePlainText(prompt);
        return parseLearningDebt(response);
    }

    private List<LearningDebtGraphDTO.AffectedTopicDTO> parseLearningDebt(String response) {
        if (response == null || response.isBlank()) {
            return new ArrayList<>();
        }

        try {
            String text = response.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            }

            int start = text.indexOf('[');
            int end = text.lastIndexOf(']');
            if (start >= 0 && end > start) {
                text = text.substring(start, end + 1);
            }

            JsonNode rootNode = mapper.readTree(text);
            List<LearningDebtGraphDTO.AffectedTopicDTO> affects = new ArrayList<>();
            for (JsonNode node : rootNode) {
                LearningDebtGraphDTO.AffectedTopicDTO dto = new LearningDebtGraphDTO.AffectedTopicDTO();
                dto.setId(java.util.UUID.fromString(node.path("id").asText()));
                dto.setName(node.path("name").asText());
                dto.setReason(node.path("reason").asText());
                dto.setSource("ai");
                affects.add(dto);
            }
            return affects;
        } catch (Exception e) {
            System.err.println("Learning Debt parse error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @lombok.Data
    public static class TopicResourceAiRankingResult {
        private String overallInsight;
        private List<RankedItem> recommendations = new ArrayList<>();

        @lombok.Data
        public static class RankedItem {
            private String resourceId;
            private Integer rank;
            private String reason;
        }
    }

    public TopicResourceAiRankingResult personalizeAndRankTopicResources(
            String branch,
            int semester,
            String topicName,
            double score,
            String status,
            String candidateResourcesJson) {

        TopicResourceAiRankingResult fallback = new TopicResourceAiRankingResult();
        fallback.setOverallInsight("Here are curated study resources organized to reinforce your understanding of " + topicName + ".");

        if (apiKey == null || apiKey.isBlank()) {
            return fallback;
        }

        String prompt = """
                You are StudyBuddy's personalized learning mentor.
                The student needs learning resources for the provided syllabus topic.

                Student context:
                Branch: %s
                Semester: %d

                Topic:
                Name: %s
                Current Score: %.1f%%
                Status: %s

                Below are REAL candidate resources retrieved from trusted APIs (YouTube, TinyFish Search, TinyFish Fetch):
                %s

                Your task:
                Evaluate and rank the resources across the three categories (videos, webResources, pdfs) based on the student's mastery level and context. Provide a concise personalized reason for why each selected resource is helpful.

                Strict Rules:
                1. ONLY select resources from the provided candidate list.
                2. NEVER invent or fabricate a resource.
                3. NEVER invent, hallucinate, or modify a URL.
                4. NEVER create a new resource ID. Use the exact "id" given in the list (e.g. yt_..., tf_web_..., tf_pdf_...).
                5. Consider the student's score and mastery status:
                   - For WEAK / low mastery (< 60%%), prioritize clear foundational tutorials and structured step-by-step guides.
                   - For AT_RISK (60-79%%), prioritize concept reinforcement, practice, and core textbook references.
                   - For STRONG (>= 80%%), prioritize deep-dive reference materials and advanced problem solving.
                6. Rank resources within each category (videos, webResources, pdfs) while preserving their type. Select up to 3 resources per category.
                7. Return valid JSON only. NO markdown blocks (```json), NO preamble, NO extra commentary.

                Required JSON structure:
                {
                  "overallInsight": "1-2 sentence personalized mentor summary of what to focus on",
                  "recommendations": [
                    {
                      "resourceId": "exact_id_from_provided_list",
                      "rank": 1,
                      "reason": "Clear explanation of how this specific resource helps the student based on their mastery"
                    }
                  ]
                }
                """.formatted(
                branch != null ? branch : "Engineering",
                semester,
                topicName,
                score,
                status,
                candidateResourcesJson
        );

        try {
            String response = generatePlainText(prompt);
            if (response == null || response.isBlank()) {
                return fallback;
            }

            String text = response.trim();
            if (text.startsWith("```")) {
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            }

            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                text = text.substring(start, end + 1);
            }

            JsonNode root = mapper.readTree(text);
            TopicResourceAiRankingResult result = new TopicResourceAiRankingResult();
            if (root.has("overallInsight") && !root.path("overallInsight").asText().isBlank()) {
                result.setOverallInsight(root.path("overallInsight").asText());
            } else {
                result.setOverallInsight(fallback.getOverallInsight());
            }

            JsonNode recsNode = root.path("recommendations");
            if (recsNode.isArray()) {
                for (JsonNode r : recsNode) {
                    String rId = r.path("resourceId").asText(null);
                    if (rId != null && !rId.isBlank()) {
                        TopicResourceAiRankingResult.RankedItem item = new TopicResourceAiRankingResult.RankedItem();
                        item.setResourceId(rId.trim());
                        item.setRank(r.path("rank").asInt(1));
                        item.setReason(r.path("reason").asText("Recommended for topic mastery."));
                        result.getRecommendations().add(item);
                    }
                }
            }
            return result;
        } catch (Exception e) {
            System.err.println("Gemini personalizeAndRankTopicResources error: " + e.getMessage());
            return fallback;
        }
    }
}