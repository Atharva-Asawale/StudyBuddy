package com.studybuddy.backend.service;

import com.studybuddy.backend.entity.TopicProgress;
import com.studybuddy.backend.entity.User;
import com.studybuddy.backend.repository.TopicProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class LearningDebtService {

    @Autowired
    private TopicProgressRepository topicProgressRepository;

    public Map<String, Object> calculateLearningDebt(User user) {

        List<TopicProgress> progressList = topicProgressRepository.findByUser(user);

        double totalDebt = 0;
        List<String> weakTopics = new ArrayList<>();

        for (TopicProgress tp : progressList) {
            if (tp.getScore() != null && tp.getScore().doubleValue() < 60) {

                double debt = 60 - tp.getScore().doubleValue();
                totalDebt += debt;

                weakTopics.add(tp.getTopic().getName());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalDebt", totalDebt);
        result.put("weakTopics", weakTopics);

        return result;
    }
}