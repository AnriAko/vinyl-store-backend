# Acceptance Criteria Progress Tracker

## User Authentication

- [x] Users can log in using Google or other SSO providers
- [x] Admins can log in using SSO

## Logout Functionality

- [x] Users can log out
- [x] Admins can log out

## Accessing Vinyl List

- [x] Users can view the vinyl list without authorization
- [x] Vinyl list displays:
    - [x] Price
    - [x] Name
    - [x] Author name
    - [x] Description
    - [x] First review from another user
    - [x] Average review score

- [x] Vinyl list supports pagination

## User Profile Management

- [x] Authenticated users can view their profiles, including:
    - [x] First name
    - [x] Last name
    - [x] Birthdate
    - [x] Avatar
    - [x] Their reviews
    - [x] Purchased vinyls

- [x] Users can edit profile information:
    - [x] First name
    - [x] Last name
    - [x] Birthdate
    - [x] Avatar

- [x] Users can delete their profiles

## Purchase Process

- [x] Authenticated users can purchase vinyl via Stripe
- [x] Users receive email notifications about payments

## Admin Functionality

- [x] Admins can add new vinyl records with:
    - [x] Author name
    - [x] Vinyl name
    - [x] Description
    - [x] Image
    - [x] Price

- [x] Admins can edit vinyl records
- [x] Admins can delete vinyl records

## Search and Sorting

- [x] Users can search vinyl records by:
    - [x] Name
    - [x] Author name

- [x] Users can sort vinyl records by:
    - [x] Price
    - [x] Name
    - [x] Author name

## Review System

- [x] Authenticated users can add reviews (comment + score)
- [x] Admins can delete reviews
- [x] Users can view all reviews for a vinyl
- [x] Reviews list supports pagination

## System Logs

- [x] Admins can view system logs including all create, update, and delete actions for all entities

---

## Optional Tasks (Showcase)

### Discogs Integration ([API](https://www.discogs.com/developers))

- [x] Initial migration of vinyl records
- [x] Display Discogs vinyl record scores
- [x] Admins can add vinyls from Discogs

### Telegram Integration

- [x] Post vinyls to Telegram channels with:
    - [x] Name
    - [x] Link to store
    - [x] Price

---
