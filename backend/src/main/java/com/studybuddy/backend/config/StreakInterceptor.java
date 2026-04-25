package com.studybuddy.backend.config;

import com.studybuddy.backend.service.StreakService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class StreakInterceptor implements HandlerInterceptor {

    @Autowired
    private StreakService streakService;

    // In-memory cache to prevent multiple updates in the same day per user
    private final ConcurrentHashMap<String, LocalDate> userLastActiveCache = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            String email = authentication.getName();
            LocalDate today = LocalDate.now();
            
            // Check cache
            LocalDate lastActive = userLastActiveCache.get(email);
            if (lastActive == null || !lastActive.isEqual(today)) {
                // Not cached or different day, update streak asynchronously if possible
                // For simplicity we do it synchronously here as it checks DB limit itself too,
                // but cache prevents DB hits on every single request
                try {
                    streakService.updateStreakForEmail(email);
                    userLastActiveCache.put(email, today);
                } catch (Exception e) {
                    // Log the error but don't block the request
                    System.err.println("Error updating streak for user: " + email + " - " + e.getMessage());
                }
            }
        }
        
        return true;
    }
}
