"""
Gamification module for MindGuard.

This module provides functionality for adding game-like elements such as
achievements, streaks, and rewards to increase user engagement with
mental health activities.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import os
import random


class GamificationSystem:
    """
    Gamification system for enhancing user engagement and motivation.
    
    This system tracks user interactions, awards achievements, maintains
    streaks, and provides rewards based on consistent engagement with
    therapeutic activities.
    """
    
    def __init__(self, user_id: str, storage_dir: str = "./data"):
        """
        Initialize the gamification system.
        
        Args:
            user_id: Unique identifier for the user
            storage_dir: Directory to store gamification data
        """
        self.user_id = user_id
        self.storage_dir = storage_dir
        
        # Define achievements with criteria, descriptions, and points
        self.achievements = {
            "first_check_in": {
                "name": "First Step",
                "description": "Complete your first mood check-in",
                "icon": "🏁",
                "points": 10,
                "tier": "bronze"
            },
            "week_streak": {
                "name": "Weekly Warrior",
                "description": "Check in for 7 consecutive days",
                "icon": "🔥",
                "points": 50,
                "tier": "silver"
            },
            "month_streak": {
                "name": "Habit Formed",
                "description": "Check in for 30 consecutive days",
                "icon": "⭐",
                "points": 200,
                "tier": "gold"
            },
            "emotion_awareness": {
                "name": "Emotion Explorer",
                "description": "Record 10 different emotions",
                "icon": "🧠",
                "points": 75,
                "tier": "silver"
            },
            "mindfulness_minutes": {
                "name": "Mindfulness Master",
                "description": "Complete 60 minutes of mindfulness exercises",
                "icon": "🧘",
                "points": 100,
                "tier": "silver"
            },
            "journal_entries": {
                "name": "Reflective Writer",
                "description": "Complete 5 journal entries",
                "icon": "📝",
                "points": 60,
                "tier": "bronze"
            },
            "cbt_exercises": {
                "name": "Thought Challenger",
                "description": "Complete 10 CBT exercises",
                "icon": "💭",
                "points": 125,
                "tier": "gold"
            },
            "progress_insight": {
                "name": "Progress Pioneer",
                "description": "Review your monthly progress report",
                "icon": "📊",
                "points": 30,
                "tier": "bronze"
            },
            "music_therapy": {
                "name": "Sound Healer",
                "description": "Use music therapy 5 times",
                "icon": "🎵",
                "points": 45,
                "tier": "bronze"
            },
            "crisis_management": {
                "name": "Resilience Builder",
                "description": "Use crisis tools to manage a difficult moment",
                "icon": "🛡️",
                "points": 90,
                "tier": "silver"
            }
        }
        
        # Define tiers and their benefits
        self.tiers = {
            "bronze": {
                "name": "Bronze Tier",
                "icon": "🥉",
                "description": "Beginning your wellness journey",
                "benefits": ["Basic guided meditations"]
            },
            "silver": {
                "name": "Silver Tier",
                "icon": "🥈",
                "description": "Building consistent healthy habits",
                "benefits": ["Advanced guided meditations", "Custom mood insights"]
            },
            "gold": {
                "name": "Gold Tier",
                "icon": "🥇",
                "description": "Mastering your mental wellness tools",
                "benefits": ["Premium content", "Personalized recommendations", "Advanced analytics"]
            },
            "platinum": {
                "name": "Platinum Tier",
                "icon": "💎",
                "description": "Elite mental wellness champion",
                "benefits": ["All premium features", "Priority support", "Exclusive content"]
            }
        }
        
        # Define user levels
        self.level_thresholds = [
            0,      # Level 1
            100,    # Level 2
            250,    # Level 3
            500,    # Level 4
            1000,   # Level 5
            2000,   # Level 6
            3500,   # Level 7
            5000,   # Level 8
            7500,   # Level 9
            10000   # Level 10
        ]
        
        # Load user data or create new profile
        self.user_data = self._load_user_data()
    
    def _load_user_data(self) -> Dict[str, Any]:
        """
        Load user gamification data from storage.
        
        Returns:
            Dictionary containing user gamification data
        """
        # Create directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Define file path
        file_path = os.path.join(self.storage_dir, f"{self.user_id}_gamification.json")
        
        # Load data if file exists
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading gamification data: {e}")
                return self._create_new_profile()
        else:
            return self._create_new_profile()
    
    def _save_user_data(self):
        """Save user gamification data to storage."""
        os.makedirs(self.storage_dir, exist_ok=True)
        file_path = os.path.join(self.storage_dir, f"{self.user_id}_gamification.json")
        
        try:
            with open(file_path, 'w') as f:
                json.dump(self.user_data, f, indent=2)
        except Exception as e:
            print(f"Error saving gamification data: {e}")
    
    def _create_new_profile(self) -> Dict[str, Any]:
        """
        Create a new user profile with default values.
        
        Returns:
            Default user profile
        """
        now = datetime.now().isoformat()
        
        return {
            "user_id": self.user_id,
            "created_at": now,
            "points": 0,
            "level": 1,
            "tier": "bronze",
            "streak": {
                "current": 0,
                "longest": 0,
                "last_check_in": None
            },
            "achievements": {},
            "activity_counts": {
                "mood_check_ins": 0,
                "cbt_exercises": 0,
                "meditation_minutes": 0,
                "journal_entries": 0,
                "music_therapy_sessions": 0,
                "crisis_tool_uses": 0
            },
            "emotions_recorded": [],
            "rewards_claimed": []
        }
    
    def record_activity(self, activity_type: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Record a user activity and update gamification elements.
        
        Args:
            activity_type: Type of activity (e.g., "mood_check_in", "cbt_exercise")
            details: Optional details about the activity
            
        Returns:
            Dictionary with updated gamification state and any new achievements
        """
        # Initialize result
        result = {
            "points_earned": 0,
            "new_achievements": [],
            "streak_updated": False,
            "level_up": False
        }
        
        # Update activity count
        self._update_activity_count(activity_type, details, result)
        
        # Update streak if this is a check-in activity
        if activity_type == "mood_check_in":
            self._update_streak(result)
            
            # Record emotion if provided
            if details and "emotion" in details:
                self._record_emotion(details["emotion"])
        
        # Check for new achievements
        new_achievements = self._check_achievements()
        if new_achievements:
            result["new_achievements"] = new_achievements
        
        # Check for level up
        old_level = self._calculate_level(self.user_data["points"])
        new_level = self._calculate_level(self.user_data["points"] + result["points_earned"])
        
        if new_level > old_level:
            self.user_data["level"] = new_level
            result["level_up"] = True
            result["new_level"] = new_level
        
        # Update total points
        self.user_data["points"] += result["points_earned"]
        
        # Update tier if needed
        self.user_data["tier"] = self._calculate_tier()
        
        # Save updated data
        self._save_user_data()
        
        return result
    
    def _update_activity_count(self, activity_type: str, details: Optional[Dict[str, Any]], result: Dict[str, Any]):
        """
        Update the count for a specific activity type.
        
        Args:
            activity_type: Type of activity
            details: Optional details about the activity
            result: Result dictionary to update with points earned
        """
        # Map activity type to the corresponding field in user_data
        activity_map = {
            "mood_check_in": "mood_check_ins",
            "cbt_exercise": "cbt_exercises",
            "meditation": "meditation_minutes",
            "journal_entry": "journal_entries",
            "music_therapy": "music_therapy_sessions",
            "crisis_tool": "crisis_tool_uses"
        }
        
        # Default points for different activities
        points_map = {
            "mood_check_in": 5,
            "cbt_exercise": 10,
            "meditation": 1,  # Per minute
            "journal_entry": 10,
            "music_therapy": 8,
            "crisis_tool": 15
        }
        
        # Get the corresponding field name
        field_name = activity_map.get(activity_type)
        
        if field_name:
            # Special case for meditation which counts minutes
            if activity_type == "meditation" and details and "minutes" in details:
                self.user_data["activity_counts"][field_name] += details["minutes"]
                result["points_earned"] = points_map[activity_type] * details["minutes"]
            else:
                # Standard increment for other activities
                self.user_data["activity_counts"][field_name] += 1
                result["points_earned"] = points_map.get(activity_type, 0)
    
    def _update_streak(self, result: Dict[str, Any]):
        """
        Update the user's check-in streak.
        
        Args:
            result: Result dictionary to update with streak information
        """
        now = datetime.now()
        last_check_in = self.user_data["streak"]["last_check_in"]
        
        # If first check-in
        if not last_check_in:
            self.user_data["streak"]["current"] = 1
            self.user_data["streak"]["longest"] = 1
            self.user_data["streak"]["last_check_in"] = now.isoformat()
            result["streak_updated"] = True
            return
        
        # Convert stored date to datetime
        last_date = datetime.fromisoformat(last_check_in)
        
        # Calculate days difference
        days_diff = (now - last_date).days
        
        # Same day, no streak update
        if days_diff == 0:
            return
            
        # Next day, continue streak
        elif days_diff == 1:
            self.user_data["streak"]["current"] += 1
            
            # Update longest streak if needed
            if self.user_data["streak"]["current"] > self.user_data["streak"]["longest"]:
                self.user_data["streak"]["longest"] = self.user_data["streak"]["current"]
                
            result["streak_updated"] = True
            
            # Bonus points for milestones
            if self.user_data["streak"]["current"] in [7, 30, 100, 365]:
                result["points_earned"] += self.user_data["streak"]["current"]
                result["streak_milestone"] = self.user_data["streak"]["current"]
        
        # Missed a day, reset streak
        else:
            self.user_data["streak"]["current"] = 1
            result["streak_reset"] = True
        
        # Update last check-in date
        self.user_data["streak"]["last_check_in"] = now.isoformat()
    
    def _record_emotion(self, emotion: str):
        """
        Record a new emotion if not already recorded.
        
        Args:
            emotion: Emotion to record
        """
        emotion = emotion.lower()
        if emotion not in self.user_data["emotions_recorded"]:
            self.user_data["emotions_recorded"].append(emotion)
    
    def _check_achievements(self) -> List[Dict[str, Any]]:
        """
        Check for new achievements based on user activity.
        
        Returns:
            List of newly unlocked achievements
        """
        new_achievements = []
        
        # Check each achievement to see if it's been earned
        for achievement_id, achievement in self.achievements.items():
            # Skip if already earned
            if achievement_id in self.user_data["achievements"]:
                continue
                
            # Check criteria for each achievement
            earned = False
            
            if achievement_id == "first_check_in":
                earned = self.user_data["activity_counts"]["mood_check_ins"] >= 1
                
            elif achievement_id == "week_streak":
                earned = self.user_data["streak"]["current"] >= 7
                
            elif achievement_id == "month_streak":
                earned = self.user_data["streak"]["current"] >= 30
                
            elif achievement_id == "emotion_awareness":
                earned = len(self.user_data["emotions_recorded"]) >= 10
                
            elif achievement_id == "mindfulness_minutes":
                earned = self.user_data["activity_counts"]["meditation_minutes"] >= 60
                
            elif achievement_id == "journal_entries":
                earned = self.user_data["activity_counts"]["journal_entries"] >= 5
                
            elif achievement_id == "cbt_exercises":
                earned = self.user_data["activity_counts"]["cbt_exercises"] >= 10
                
            elif achievement_id == "progress_insight":
                # This would be triggered by a specific action
                pass
                
            elif achievement_id == "music_therapy":
                earned = self.user_data["activity_counts"]["music_therapy_sessions"] >= 5
                
            elif achievement_id == "crisis_management":
                earned = self.user_data["activity_counts"]["crisis_tool_uses"] >= 1
            
            # If earned, add to user achievements and new achievements list
            if earned:
                self.user_data["achievements"][achievement_id] = {
                    "earned_at": datetime.now().isoformat(),
                    "details": achievement
                }
                
                # Add achievement points
                self.user_data["points"] += achievement["points"]
                
                # Add to result
                new_achievements.append({
                    "id": achievement_id,
                    "name": achievement["name"],
                    "description": achievement["description"],
                    "icon": achievement["icon"],
                    "points": achievement["points"]
                })
        
        return new_achievements
    
    def _calculate_level(self, points: int) -> int:
        """
        Calculate user level based on points.
        
        Args:
            points: Total points earned
            
        Returns:
            User level (1-10)
        """
        for i, threshold in enumerate(self.level_thresholds):
            if points < threshold:
                return i
        
        # If above all thresholds, return max level
        return len(self.level_thresholds)
    
    def _calculate_tier(self) -> str:
        """
        Calculate user tier based on achievements and level.
        
        Returns:
            User tier (bronze, silver, gold, platinum)
        """
        # Count achievements by tier
        tier_counts = {"bronze": 0, "silver": 0, "gold": 0}
        
        for achievement_id in self.user_data["achievements"]:
            if achievement_id in self.achievements:
                tier = self.achievements[achievement_id]["tier"]
                tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        # Determine tier based on achievement counts and level
        if tier_counts["gold"] >= 3 and self.user_data["level"] >= 8:
            return "platinum"
        elif tier_counts["gold"] >= 1 and tier_counts["silver"] >= 2:
            return "gold"
        elif tier_counts["silver"] >= 1 or tier_counts["bronze"] >= 3:
            return "silver"
        else:
            return "bronze"
    
    def get_user_progress(self) -> Dict[str, Any]:
        """
        Get user progress summary.
        
        Returns:
            Dictionary with user progress information
        """
        # Calculate progress to next level
        current_level = self.user_data["level"]
        
        if current_level < len(self.level_thresholds):
            current_threshold = self.level_thresholds[current_level - 1]
            next_threshold = self.level_thresholds[current_level]
            level_progress = (self.user_data["points"] - current_threshold) / (next_threshold - current_threshold)
        else:
            level_progress = 1.0
        
        # Calculate completion percentages
        achievements_total = len(self.achievements)
        achievements_earned = len(self.user_data["achievements"])
        achievements_progress = achievements_earned / achievements_total if achievements_total > 0 else 0
        
        # Build user progress object
        return {
            "points": self.user_data["points"],
            "level": self.user_data["level"],
            "tier": {
                "name": self.tiers[self.user_data["tier"]]["name"],
                "icon": self.tiers[self.user_data["tier"]]["icon"],
                "description": self.tiers[self.user_data["tier"]]["description"],
                "benefits": self.tiers[self.user_data["tier"]]["benefits"]
            },
            "streak": {
                "current": self.user_data["streak"]["current"],
                "longest": self.user_data["streak"]["longest"]
            },
            "level_progress": level_progress,
            "achievements": {
                "earned": achievements_earned,
                "total": achievements_total,
                "progress": achievements_progress,
                "list": [
                    {
                        "id": achievement_id,
                        "name": self.achievements[achievement_id]["name"],
                        "description": self.achievements[achievement_id]["description"],
                        "icon": self.achievements[achievement_id]["icon"],
                        "earned": achievement_id in self.user_data["achievements"],
                        "earned_at": self.user_data["achievements"].get(achievement_id, {}).get("earned_at")
                    }
                    for achievement_id in self.achievements
                ]
            },
            "activity_counts": self.user_data["activity_counts"],
            "emotions_recorded": len(self.user_data["emotions_recorded"])
        }
    
    def get_daily_challenge(self) -> Dict[str, Any]:
        """
        Get a personalized daily challenge based on user activity.
        
        Returns:
            Dictionary with challenge details
        """
        # Simple challenges based on user activity patterns
        challenges = [
            {
                "id": "mood_awareness",
                "name": "Mood Check-In",
                "description": "Record your mood three times today",
                "reward_points": 15,
                "icon": "📊"
            },
            {
                "id": "meditation_session",
                "name": "Mindfulness Moment",
                "description": "Complete a 10-minute meditation session",
                "reward_points": 20,
                "icon": "🧘"
            },
            {
                "id": "thought_record",
                "name": "Thought Diary",
                "description": "Record and challenge one negative thought",
                "reward_points": 25,
                "icon": "💭"
            },
            {
                "id": "gratitude_journal",
                "name": "Gratitude Practice",
                "description": "Write down three things you're grateful for",
                "reward_points": 15,
                "icon": "🙏"
            },
            {
                "id": "music_therapy",
                "name": "Sound Healing",
                "description": "Listen to a recommended music therapy track",
                "reward_points": 15,
                "icon": "🎵"
            }
        ]
        
        # For demonstration, select a random challenge
        # In production, this would use more sophisticated selection logic
        # based on user history and therapeutic needs
        return random.choice(challenges) 