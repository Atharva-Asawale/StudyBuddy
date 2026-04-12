package com.studybuddy.backend.service;

import com.studybuddy.backend.dto.QuizQuestionDTO;
import com.studybuddy.backend.dto.QuizResultDTO;
import com.studybuddy.backend.dto.QuizSubmitRequest;
import com.studybuddy.backend.entity.QuizResult;
import com.studybuddy.backend.entity.SyllabusNode;
import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.QuizResultRepository;
import com.studybuddy.backend.repository.SyllabusNodeRepository;
import com.studybuddy.backend.repository.TopicProgressRepository;
import com.studybuddy.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class QuizService {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private SyllabusNodeRepository syllabusNodeRepository;

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    // Generate quiz for a topic
    public List<QuizQuestionDTO> generateQuiz(UUID topicId) {
        SyllabusNode topic = syllabusNodeRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        String subjectName = getSubjectName(topic);
        return geminiService.generateQuiz(topic.getName(), subjectName);
    }

    // Submit quiz and save progress
    public QuizResultDTO submitQuiz(String email, QuizSubmitRequest request,
                                    List<QuizQuestionDTO> questions) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SyllabusNode topic = syllabusNodeRepository.findById(request.getTopicId())
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        // Calculate score
        int correct = 0;
        List<Integer> selected = request.getSelectedAnswers();
        for (int i = 0; i < questions.size() && i < selected.size(); i++) {
            if (questions.get(i).getCorrectIndex() == selected.get(i)) {
                correct++;
            }
        }

        double percentage = (double) correct / questions.size() * 100;
        boolean mastered = percentage >= 70;

        QuizResult quizResult = new QuizResult();
        quizResult.setUser(user);
        quizResult.setTopic(topic);
        quizResult.setScore(BigDecimal.valueOf(percentage));
        quizResult.setCorrectAnswers(correct);
        quizResult.setTotalQuestions(questions.size());
        quizResultRepository.save(quizResult);

        // Save or update topic progress
        Optional<TopicProgress> existing = topicProgressRepository
                .findByUserAndTopic(user, topic);

        TopicProgress progress = existing.orElse(new TopicProgress());
        progress.setUser(user);
        progress.setTopic(topic);
        progress.setScore(BigDecimal.valueOf(percentage));
        progress.setAttempts((progress.getAttempts() == null ? 0 : progress.getAttempts()) + 1);
        progress.setMastered(mastered);
        topicProgressRepository.save(progress);

        // Build result
        QuizResultDTO result = new QuizResultDTO();
        result.setScore(correct);
        result.setTotal(questions.size());
        result.setPercentage(percentage);
        result.setMastered(mastered);
        result.setQuestions(questions);
        result.setSelectedAnswers(selected);
        result.setFeedback(getFeedback(percentage));

        return result;
    }

    private String getFeedback(double percentage) {
        if (percentage >= 90) return "Excellent! You have mastered this topic.";
        if (percentage >= 70) return "Good job! Topic marked as mastered.";
        if (percentage >= 50) return "Fair attempt. Review weak areas and try again.";
        return "Needs improvement. Study this topic carefully and retry.";
    }

    private String getSubjectName(SyllabusNode node) {
        if (node.getParent() == null) return node.getName();
        return getSubjectName(node.getParent());
    }
}
