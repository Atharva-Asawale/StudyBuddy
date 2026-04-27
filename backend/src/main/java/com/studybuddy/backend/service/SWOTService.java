package com.studybuddy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studybuddy.backend.dto.SWOTResponseDTO;
import com.studybuddy.backend.entity.*;
import com.studybuddy.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SWOTService {

    private final TopicProgressRepository topicProgressRepository;
    private final SemesterRepository semesterRepository;
    private final SyllabusNodeRepository syllabusNodeRepository;
    private final GeminiService geminiService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public SWOTResponseDTO generateSWOT(User user) {
        // STEP 1: Fetch all topic progress for user
        List<TopicProgress> allProgress = topicProgressRepository.findByUser(user);

        // STEP 2: Rule-based classification
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> opportunities = new ArrayList<>();
        List<String> threats = new ArrayList<>();

        for (TopicProgress tp : allProgress) {
            double score = tp.getScore() != null ? tp.getScore().doubleValue() : 0.0;
            int attempts = tp.getAttempts() != null ? tp.getAttempts() : 0;
            String topicName = tp.getTopic().getName();

            if (score >= 75.0) {
                strengths.add(topicName);
            } else if (score < 50.0) {
                weaknesses.add(topicName);
            } else if (attempts >= 2 && score >= 50.0 && score < 75.0) {
                threats.add(topicName); // stuck in middle despite retrying
            }
        }

        // Opportunities: topics in syllabus never attempted
        Set<UUID> attemptedTopicIds = allProgress.stream()
                .map(tp -> tp.getTopic().getId())
                .collect(Collectors.toSet());

        // Use a more robust search for syllabus nodes (branch and type)
        List<SyllabusNode> allTopics = syllabusNodeRepository.findAll().stream()
                .filter(node -> node.getBranch() != null && node.getBranch().equalsIgnoreCase(user.getBranch()))
                .filter(node -> "topic".equalsIgnoreCase(node.getType()))
                .collect(Collectors.toList());

        for (SyllabusNode node : allTopics) {
            if (!attemptedTopicIds.contains(node.getId())) {
                opportunities.add(node.getName());
            }
        }

        // Limit lists to avoid overwhelming prompt
        strengths = strengths.stream().limit(10).collect(Collectors.toList());
        weaknesses = weaknesses.stream().limit(10).collect(Collectors.toList());
        opportunities = opportunities.stream().limit(8).collect(Collectors.toList());
        threats = threats.stream().limit(8).collect(Collectors.toList());

        // STEP 3: Academic signals from semesters
        List<Semester> semesters = semesterRepository.findByUserIdWithSubjects(user.getId());

        double cgpaTrend = 0.0;
        double currentCgpa = 0.0;
        String topSubject = "N/A";
        String weakestSubject = "N/A";

        if (!semesters.isEmpty()) {
            Semester latestSem = semesters.get(semesters.size() - 1);
            currentCgpa = latestSem.getCgpa() != null ? latestSem.getCgpa().doubleValue() : 0.0;
            
            if (semesters.size() >= 2) {
                double previous = semesters.get(semesters.size() - 2).getCgpa() != null ? semesters.get(semesters.size() - 2).getCgpa().doubleValue() : 0.0;
                cgpaTrend = currentCgpa - previous;
            }
        }

        // Find top and weakest subject across all semesters
        Map<String, List<Double>> subjectScores = new HashMap<>();
        for (Semester sem : semesters) {
            if (sem.getSubjects() != null) {
                for (SubjectPerformance sp : sem.getSubjects()) {
                    if (sp.getSubjectName() != null) {
                        subjectScores
                                .computeIfAbsent(sp.getSubjectName(), k -> new ArrayList<>())
                                .add(sp.getScore() != null ? sp.getScore().doubleValue() : 0.0);
                    }
                }
            }
        }

        double highestAvg = -1, lowestAvg = 101;
        for (Map.Entry<String, List<Double>> entry : subjectScores.entrySet()) {
            double avg = entry.getValue().stream()
                    .mapToDouble(Double::doubleValue).average().orElse(0.0);
            if (avg > highestAvg) {
                highestAvg = avg;
                topSubject = entry.getKey();
            }
            if (avg < lowestAvg) {
                lowestAvg = avg;
                weakestSubject = entry.getKey();
            }
        }

        int totalAttempted = allProgress.size();
        int totalMastered = (int) allProgress.stream()
                .filter(tp -> tp.getMastered() != null && tp.getMastered())
                .count();

        // Trend description for prompt
        String trendDesc;
        if (Math.abs(cgpaTrend) < 0.01) trendDesc = "Stable (0.00 change)";
        else if (cgpaTrend > 0) trendDesc = "+" + String.format("%.2f", cgpaTrend) + " (Improving)";
        else trendDesc = String.format("%.2f", cgpaTrend) + " (Declining)";

        // STEP 4: Build Gemini prompt
        String prompt = """
                You are a high-level academic and career consultant AI.
                Analyze the student's performance data and generate a deep, professional SWOT analysis.
                
                STUDENT DATA:
                - Branch: %s
                - Current Semester: %d
                - Current CGPA: %.2f
                - CGPA Trend: %s
                - Topics Mastered: %d
                - Total Topics Attempted: %d
                - Top Performing Subject: %s
                - Weakest Subject: %s
                
                RULE-BASED FINDINGS:
                Strengths (topics scored ≥75%%): %s
                Weaknesses (topics scored <50%%): %s
                Opportunities (never attempted topics): %s
                Threats (stuck topics, scored 50-74%% despite multiple attempts): %s
                
                Generate a JSON response with exactly these 7 keys:
                {
                  "strengthsAI": "3-4 sentence narrative celebrating specific mastered topics and the skills they represent",
                  "weaknessesAI": "3-4 sentence constructive narrative on weak areas, focusing on conceptual gaps and how to bridge them",
                  "opportunitiesAI": "3-4 sentence narrative highlighting how unattempted topics connect to current strengths and future growth",
                  "threatsAI": "3-4 sentence serious but motivating narrative about risks like CGPA drops or stagnation in 'stuck' topics",
                  "overallAdvice": "A detailed 2-paragraph personalized study strategy. Paragraph 1: Immediate focus areas. Paragraph 2: Long-term academic habits.",
                  "careerAdvice": "Detailed advice (4-5 sentences) on potential career paths, internships, or specializations based on the student's top subjects and strengths in %s.",
                  "detailedAnalysis": "A comprehensive summary (5-6 sentences) of the student's current academic standing, comparing their progress against expected outcomes for their branch and semester."
                }
                
                RULES:
                - Be EXTREMELY specific — mention actual topic names and subject names multiple times.
                - DO NOT assume a declining trend if the trend is Stable (0.00 change).
                - DO NOT hallucinate a 0.00 CGPA if the current CGPA provided is different.
                - Career advice MUST be tailored to the %s branch.
                - Use professional, mentor-like language.
                - Return ONLY valid JSON. No markdown. No code blocks. No extra text.
                """.formatted(
                user.getBranch(),
                user.getCurrentSemester(),
                currentCgpa,
                trendDesc,
                totalMastered,
                totalAttempted,
                topSubject,
                weakestSubject,
                strengths.isEmpty() ? "None yet" : String.join(", ", strengths),
                weaknesses.isEmpty() ? "None yet" : String.join(", ", weaknesses),
                opportunities.isEmpty() ? "None yet" : String.join(", ", opportunities.subList(0, Math.min(5, opportunities.size()))),
                threats.isEmpty() ? "None yet" : String.join(", ", threats),
                user.getBranch(),
                user.getBranch()
        );

        // STEP 5: Call Gemini and parse response
        String aiResponse = geminiService.generatePlainText(prompt);

        String strengthsAI = "Analysis unavailable.";
        String weaknessesAI = "Analysis unavailable.";
        String opportunitiesAI = "Analysis unavailable.";
        String threatsAI = "Analysis unavailable.";
        String overallAdvice = "Analysis unavailable.";
        String careerAdvice = "Analysis unavailable.";
        String detailedAnalysis = "Analysis unavailable.";

        if (aiResponse != null) {
            try {
                String jsonText = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
                
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(jsonText);
                strengthsAI = root.path("strengthsAI").asText("Analysis unavailable.");
                weaknessesAI = root.path("weaknessesAI").asText("Analysis unavailable.");
                opportunitiesAI = root.path("opportunitiesAI").asText("Analysis unavailable.");
                threatsAI = root.path("threatsAI").asText("Analysis unavailable.");
                overallAdvice = root.path("overallAdvice").asText("Analysis unavailable.");
                careerAdvice = root.path("careerAdvice").asText("Analysis unavailable.");
                detailedAnalysis = root.path("detailedAnalysis").asText("Analysis unavailable.");
            } catch (Exception e) {
                overallAdvice = aiResponse;
            }
        }

        // STEP 6: Build and return DTO
        SWOTResponseDTO dto = new SWOTResponseDTO();
        dto.setStrengths(strengths);
        dto.setWeaknesses(weaknesses);
        dto.setOpportunities(opportunities);
        dto.setThreats(threats);
        dto.setStrengthsAI(strengthsAI);
        dto.setWeaknessesAI(weaknessesAI);
        dto.setOpportunitiesAI(opportunitiesAI);
        dto.setThreatsAI(threatsAI);
        dto.setOverallAdvice(overallAdvice);
        dto.setCareerAdvice(careerAdvice);
        dto.setDetailedAnalysis(detailedAnalysis);
        dto.setCgpaTrend(cgpaTrend);
        dto.setTopSubject(topSubject);
        dto.setWeakestSubject(weakestSubject);
        dto.setTotalAttempted(totalAttempted);
        dto.setTotalMastered(totalMastered);
        return dto;
    }
}
