#!/usr/bin/env python3
import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import os
import requests
import json
import random

class TestSettingsUI(unittest.TestCase):
    """Test suite for Settings UI functionality"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment once for all tests"""
        # Setup Chrome or Firefox options for headless execution
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        cls.driver = webdriver.Chrome(options=options)
        
        # Set implicit wait time for elements
        cls.driver.implicitly_wait(10)
        cls.wait = WebDriverWait(cls.driver, 10)
        
        # App URL
        cls.base_url = "http://localhost:5000"
        
        # Login with admin credentials
        cls.login("admin@example.com", "password")
    
    @classmethod
    def login(cls, email, password):
        """Log in to the application"""
        cls.driver.get(f"{cls.base_url}/login")
        cls.driver.find_element(By.ID, "email").send_keys(email)
        cls.driver.find_element(By.ID, "password").send_keys(password)
        cls.driver.find_element(By.ID, "submit").click()
        
        # Verify login successful
        WebDriverWait(cls.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".sidebar"))
        )
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests have run"""
        if cls.driver:
            cls.driver.quit()
    
    def setUp(self):
        """Set up before each test"""
        # Navigate to settings page
        self.driver.get(f"{self.base_url}/settings")
        # Wait for settings page to load
        self.wait.until(EC.presence_of_element_located((By.ID, "settings-form")))
    
    def test_001_session_management_terminate_button_style(self):
        """Test that session management terminate button has correct style"""
        # Wait for sessions to load
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "#sessions-container .loading-spinner")))
        
        # Find terminate button
        try:
            terminate_button = self.driver.find_element(By.CSS_SELECTOR, ".terminate-session")
            
            # Check button styling
            button_classes = terminate_button.get_attribute("class")
            self.assertIn("btn", button_classes, "Terminate button missing 'btn' class")
            self.assertIn("btn-icon", button_classes, "Terminate button missing 'btn-icon' class")
            
            # Check button icon
            icon = terminate_button.find_element(By.CSS_SELECTOR, "i")
            icon_classes = icon.get_attribute("class")
            self.assertIn("fa-power-off", icon_classes, "Terminate button icon incorrect")
            
            # Get computed style of button
            button_bg_color = self.driver.execute_script(
                "return window.getComputedStyle(arguments[0]).getPropertyValue('background-color')", 
                terminate_button
            )
            
            # Should match the theme (gradient or solid color)
            primary_color = self.driver.execute_script(
                "return getComputedStyle(document.documentElement).getPropertyValue('--primary')"
            )
            self.assertIsNotNone(button_bg_color, "Button background color should be defined")
            
        except NoSuchElementException:
            self.fail("Terminate session button not found")
    
    def test_002_color_picker_flicker(self):
        """Test color picker for flickering"""
        color_input = self.driver.find_element(By.ID, "primary_color")
        
        # Record initial color
        initial_color = color_input.get_attribute("value")
        
        # Generate a random color that's different from initial
        new_color = "#" + "".join([random.choice("0123456789ABCDEF") for _ in range(6)])
        while new_color == initial_color:
            new_color = "#" + "".join([random.choice("0123456789ABCDEF") for _ in range(6)])
        
        # Clear the input and set the new color
        color_input.clear()
        color_input.send_keys(new_color)
        
        # Small wait to let color update
        time.sleep(0.1)
        
        # Get applied colors over time to check for flickering
        colors = []
        for _ in range(5):
            current_color = self.driver.execute_script(
                "return getComputedStyle(document.documentElement).getPropertyValue('--primary')"
            )
            colors.append(current_color)
            time.sleep(0.1)
        
        # Check for flickering (multiple different values)
        unique_colors = set(colors)
        self.assertLessEqual(len(unique_colors), 2, f"Color flickering detected: {unique_colors}")
        
        # Reset to initial color
        color_input.clear()
        color_input.send_keys(initial_color)
    
    def test_003_container_start_stop_buttons(self):
        """Test container start/stop button functionality and status updates"""
        # Find all container cards
        container_cards = self.driver.find_elements(By.CSS_SELECTOR, ".settings-card .card-body .settings-card")
        
        for card in container_cards:
            # Check if this is a container card with status indicator
            status_indicators = card.find_elements(By.CSS_SELECTOR, ".container-status .status-indicator")
            if not status_indicators:
                continue
                
            container_title = card.find_element(By.CSS_SELECTOR, ".card-title").text
            
            # Find start/stop buttons
            start_buttons = card.find_elements(By.CSS_SELECTOR, "button[id^='start-']")
            stop_buttons = card.find_elements(By.CSS_SELECTOR, "button[id^='stop-']")
            
            # Capture initial status
            initial_status_text = status_indicators[0].text
            initial_status_classes = status_indicators[0].get_attribute("class")
            
            # Test available action based on current status
            if "status-running" in initial_status_classes and stop_buttons:
                # Container is running, we can stop it
                print(f"Testing stop functionality for {container_title}")
                
                # Click stop button
                stop_buttons[0].click()
                
                # Click confirm in modal
                self.wait.until(EC.element_to_be_clickable((By.ID, "confirmModalActionBtn"))).click()
                
                # Wait for status to change
                try:
                    self.wait.until_not(
                        EC.text_to_be_present_in_element((By.CSS_SELECTOR, ".container-status .status-indicator"), initial_status_text)
                    )
                    
                    # Verify start button appears
                    self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "button[id^='start-']")))
                    
                    # Verify status text changed
                    new_status = card.find_element(By.CSS_SELECTOR, ".container-status .status-indicator").text
                    self.assertNotEqual(initial_status_text, new_status, f"Status text did not change for {container_title}")
                    
                    # Verify status class changed
                    new_status_classes = card.find_element(By.CSS_SELECTOR, ".container-status .status-indicator").get_attribute("class")
                    self.assertNotEqual(initial_status_classes, new_status_classes, f"Status class did not change for {container_title}")
                    
                except TimeoutException:
                    self.fail(f"Status did not change after stopping {container_title}")
                
            elif not "status-running" in initial_status_classes and start_buttons:
                # Container is not running, we can start it
                print(f"Testing start functionality for {container_title}")
                
                # Click start button
                start_buttons[0].click()
                
                # Wait for status to change
                try:
                    self.wait.until_not(
                        EC.text_to_be_present_in_element((By.CSS_SELECTOR, ".container-status .status-indicator"), initial_status_text)
                    )
                    
                    # Verify status text changed
                    new_status = card.find_element(By.CSS_SELECTOR, ".container-status .status-indicator").text
                    self.assertNotEqual(initial_status_text, new_status, f"Status text did not change for {container_title}")
                    
                    # Verify status class changed
                    new_status_classes = card.find_element(By.CSS_SELECTOR, ".container-status .status-indicator").get_attribute("class")
                    self.assertNotEqual(initial_status_classes, new_status_classes, f"Status class did not change for {container_title}")
                    
                except TimeoutException:
                    self.fail(f"Status did not change after starting {container_title}")
    
    def test_004_user_card_functionality(self):
        """Test the user management card functionality"""
        # Wait for users to load
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "#users-container .loading-spinner")))
        
        # Check user card exists and has correct layout
        user_cards = self.driver.find_elements(By.CSS_SELECTOR, ".user-card")
        self.assertTrue(len(user_cards) > 0, "No user cards found")
        
        # Check each user card has the correct layout
        for card in user_cards:
            # Check user info section
            self.assertIsNotNone(card.find_element(By.CSS_SELECTOR, ".user-info"), "User info section missing")
            self.assertIsNotNone(card.find_element(By.CSS_SELECTOR, ".user-icon"), "User icon missing")
            self.assertIsNotNone(card.find_element(By.CSS_SELECTOR, ".user-details"), "User details missing")
            self.assertIsNotNone(card.find_element(By.CSS_SELECTOR, ".user-name"), "Username missing")
            self.assertIsNotNone(card.find_element(By.CSS_SELECTOR, ".user-badges"), "User badges missing")
            
            # Check user actions section
            self.assertIsNotNone(card.find_element(By.CSS_SELECTOR, ".user-actions"), "User actions missing")
            
            # At least one button should exist
            buttons = card.find_elements(By.CSS_SELECTOR, "button")
            self.assertTrue(len(buttons) > 0, "No action buttons found in user card")
        
        # Test 'Add User' button
        add_user_button = self.driver.find_element(By.ID, "add-user")
        add_user_button.click()
        
        # User modal should appear
        modal = self.wait.until(EC.visibility_of_element_located((By.ID, "userModal")))
        self.assertTrue(modal.is_displayed(), "User modal did not open")
        
        # Fill in user details (but don't submit yet)
        new_email = f"test_user_{int(time.time())}@example.com"
        new_password = "Password123!"
        
        modal.find_element(By.ID, "user_modal_email").send_keys(new_email)
        modal.find_element(By.ID, "user_modal_password").send_keys(new_password)
        modal.find_element(By.ID, "user_modal_confirm_password").send_keys(new_password)
        
        # Click add user button
        modal.find_element(By.ID, "userModalActionBtn").click()
        
        # Wait for modal to close and check if user was added
        try:
            self.wait.until(EC.invisibility_of_element_located((By.ID, "userModal")))
            
            # Refresh the user list to see if new user appears
            self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".notification.success")))
            self.driver.refresh()
            self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "#users-container .loading-spinner")))
            
            # Find the new user
            user_cards = self.driver.find_elements(By.CSS_SELECTOR, ".user-card")
            new_user_found = False
            
            for card in user_cards:
                if new_email in card.find_element(By.CSS_SELECTOR, ".user-name").text:
                    new_user_found = True
                    
                    # Test change password button
                    password_button = card.find_element(By.CSS_SELECTOR, ".change-password")
                    password_button.click()
                    
                    # Password modal should appear
                    pwd_modal = self.wait.until(EC.visibility_of_element_located((By.ID, "passwordModal")))
                    self.assertTrue(pwd_modal.is_displayed(), "Password modal did not open")
                    
                    # Fill in password details
                    updated_password = "UpdatedPass456!"
                    pwd_modal.find_element(By.ID, "password_modal_password").send_keys(updated_password)
                    pwd_modal.find_element(By.ID, "password_modal_confirm").send_keys(updated_password)
                    
                    # Click change password button
                    pwd_modal.find_element(By.ID, "passwordModalActionBtn").click()
                    
                    # Wait for modal to close
                    self.wait.until(EC.invisibility_of_element_located((By.ID, "passwordModal")))
                    
                    # Test delete button
                    delete_button = card.find_element(By.CSS_SELECTOR, ".delete-user")
                    delete_button.click()
                    
                    # Confirmation modal should appear
                    confirm_modal = self.wait.until(EC.visibility_of_element_located((By.ID, "confirmationModal")))
                    self.assertTrue(confirm_modal.is_displayed(), "Confirmation modal did not open")
                    
                    # Click confirm button
                    confirm_modal.find_element(By.ID, "confirmModalActionBtn").click()
                    
                    # Wait for user to be deleted
                    self.wait.until(EC.invisibility_of_element_located((By.ID, "confirmationModal")))
                    break
                    
            self.assertTrue(new_user_found, f"Newly added user {new_email} not found in user list")
            
        except TimeoutException:
            self.fail("User add operation did not complete successfully")
    
    def test_005_account_settings_functionality(self):
        """Test account settings update functionality"""
        # Find account settings section
        account_section = self.driver.find_element(By.CSS_SELECTOR, '.settings-card .card-title i.fa-user-shield').find_element(By.XPATH, './ancestor::div[contains(@class, "settings-card")]')
        
        # Get the email field and current value
        email_field = account_section.find_element(By.ID, "user_email")
        current_email = email_field.get_attribute("value")
        
        # Generate a new test email
        test_email = f"test_{int(time.time())}@example.com"
        
        # Update email
        email_field.clear()
        email_field.send_keys(test_email)
        
        # Set test password
        password_field = account_section.find_element(By.ID, "user_password")
        confirm_field = account_section.find_element(By.ID, "confirm_password")
        test_password = "TestPassword123!"
        
        password_field.send_keys(test_password)
        confirm_field.send_keys(test_password)
        
        # Click update button
        update_button = account_section.find_element(By.ID, "update-user")
        update_button.click()
        
        # Check for success notification
        try:
            self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".notification.success")))
            
            # Reset back to original email to avoid breaking other tests
            email_field.clear()
            email_field.send_keys(current_email)
            update_button.click()
            
        except TimeoutException:
            self.fail("Credentials update did not show success notification")

if __name__ == "__main__":
    unittest.main() 