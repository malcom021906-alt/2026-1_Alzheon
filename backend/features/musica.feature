Feature: Music Therapy Functionality
  As a user of the Alzheon system
  I want to manage music therapy playlists and track emotional reactions
  So that patients can benefit from music-based cognitive stimulation

  Background:
    Given the server is running
    And the database is clean

  Scenario: Cuidador searches for songs
    Given I am logged in as a cuidador
    And I have a patient associated
    When I search for songs with query "beatles"
    Then I should receive search results
    And each result should have videoId, title, artist and thumbnail

  Scenario: Cuidador manages patient playlist
    Given I am logged in as a cuidador
    And I have a patient associated
    When I get the patient playlist
    Then I should receive an empty playlist initially
    When I add a song to the playlist
    Then the playlist should contain the new song
    When I remove the song from the playlist
    Then the playlist should be empty again

  Scenario: Patient registers emotional reaction
    Given I am logged in as a paciente
    And I have songs in my playlist
    When I register a reaction to a song with emotion "feliz"
    Then the reaction should be saved successfully
    And the reaction should include emotion and memory details

  Scenario: Patient views their reaction history
    Given I am logged in as a paciente
    And I have registered reactions to songs
    When I get my reaction history
    Then I should see all my reactions ordered by date

  Scenario: Cuidador views patient reactions
    Given I am logged in as a cuidador
    And I have a patient associated
    And the patient has registered reactions
    When I get the patient reactions
    Then I should see all patient reactions
    When I add a caregiver note to a reaction
    Then the note should be saved

  Scenario: Medico views patient music analytics
    Given I am logged in as a medico
    And I have a patient assigned
    And the patient has music reactions
    When I get the patient music analytics
    Then I should see reactions with statistics
    And statistics should include emotion counts and memory levels

  Scenario: Duplicate song prevention
    Given I am logged in as a cuidador
    And I have a patient associated
    And I added a song to the playlist
    When I try to add the same song again
    Then I should receive an error about duplicate song

  Scenario: Invalid emotion handling
    Given I am logged in as a paciente
    When I try to register a reaction with invalid emotion
    Then I should receive a validation error
