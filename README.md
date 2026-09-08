# Campus Navigator

CAMPUS TRUTH — FULL PRODUCT BUILD SPECIFICATION

You are building CampusTruth, a modern student information and community platform.

The goal is to create a trustworthy digital home for students where they can find verified school information, campus updates, ask questions, interact with other students, and use an AI assistant that understands their school.

The first target school is University of Lagos (UNILAG).

I have already provided Figma designs for some parts of the application. Treat those designs as the primary visual reference. Do not redesign the existing screens unnecessarily. For pages that are not represented in the Figma designs, create new screens that feel like they belong to the exact same product and design system.

The application should feel like a polished startup product — modern, fast, clean, student-focused, trustworthy, and production-ready.

1. PRODUCT VISION

CampusTruth solves a simple problem:

Students currently get important school information from scattered WhatsApp groups, course reps, Telegram groups, Instagram pages, friends, rumors, and outdated documents.

This creates confusion and misinformation.

CampusTruth should become a centralized platform where students can ask:

What's happening on campus?

When is registration?

When are exams?

What are the school fees?

What documents do I need?

When does a semester start?

What is the latest announcement?

What is happening in my faculty?

What does this school announcement mean?

Who can I contact about this issue?

The platform should combine:

Verified campus information

Campus news and updates

Student posts

Student Q&A

AI Campus Assistant

School/faculty/department communities

User profiles

Notifications

Search

Moderation and administration

The central principle is:

CampusTruth should prioritize TRUST over engagement.

Do not design the product like a generic social media app.

2. TARGET USERS

The initial users are UNILAG students.

Users should be able to provide/select:

School

Faculty

Department

Level

Optional interests

The platform should be designed so that additional universities can be added later.

Do not hard-code the entire application around UNILAG in a way that makes expansion impossible.

Use a school-based architecture.

Example:

School
→ Faculty
→ Department
→ Level
→ Community

3. DESIGN DIRECTION

Use the provided Figma designs as the visual source of truth.

Preserve:

Color palette

Typography

Border radius

Card style

Spacing

Navigation style

Button style

Icon style

Layout hierarchy

Visual language

Overall personality

CampusTruth's established brand colors are:

Primary lime:
#F2FD7D

Dark green:
#28443F

Use these intelligently rather than covering the entire UI in bright lime.

The interface should feel:

modern

minimal

premium

youthful

trustworthy

approachable

clean

highly usable

Avoid:

generic SaaS templates

excessive gradients

unnecessary glassmorphism

overly rounded childish interfaces

excessive animations

clutter

unnecessary UI elements

Animations should be subtle and purposeful.

4. RESPONSIVE DESIGN

The application must work extremely well on:

Mobile phones

Tablets

Laptops

Desktop monitors

Mobile is especially important because students will primarily access CampusTruth from their phones.

Do not simply shrink desktop layouts.

Create proper responsive layouts.

On mobile:

use bottom navigation where appropriate

make cards readable

avoid horizontal overflow

use appropriate touch targets

make chat comfortable to use

make posting easy

optimize images

use responsive sheets/modals

maintain the visual hierarchy from the Figma design

5. CORE APPLICATION STRUCTURE

Create the following major areas.

PUBLIC

Landing Page

The landing page should explain:

What CampusTruth is

Why it exists

The problem with scattered campus information

Key features

AI Campus Assistant

Verified information

Campus updates

Student community

How it works

Target school

Waitlist / sign-up CTA

Footer

The page should feel like a real startup landing page.

6. AUTHENTICATION

Implement authentication using Supabase Auth.

Support:

Sign up

Login

Logout

Password reset

Session persistence

Protected routes

Registration should collect the information needed to personalize CampusTruth.

Possible onboarding fields:

Full name

Email

Password

School

Faculty

Department

Level

After registration, show a short onboarding experience.

Example:

Welcome to CampusTruth.

Tell us a little about yourself so we can personalize your campus experience.

School → Faculty → Department → Level

Users should be able to update these later.

7. USER ROLES

Implement role-based permissions.

Roles:

Student

Can:

read posts

create posts

comment

like/react

ask questions

use AI assistant

report content

manage profile

receive notifications

Course Representative

Course reps should have additional capabilities such as:

verified/representative badge

post important course-level updates

answer student questions

moderate relevant discussions

access representative-specific tools if appropriate

Do not allow users to simply claim they are a course rep.

Verification should be controlled by administrators.

Admin

Admins can:

manage users

manage schools

manage faculties

manage departments

create/edit verified announcements

approve/reject posts

verify representatives

moderate comments

manage reported content

manage AI knowledge sources

manage campus information

view platform analytics

8. MAIN DASHBOARD / HOME FEED

The main feed is one of the most important parts of CampusTruth.

It should show relevant campus information based on the user's school and profile.

Feed content can include:

Official announcements

Clearly marked as verified.

Example:

✓ Verified

University of Lagos

Important academic calendar update...

Campus news

Updates from trusted sources.

Student posts

Posts created by CampusTruth users.

Course/department updates

Relevant information for specific groups.

Feed cards should clearly distinguish:

Official

Verified

Course Rep

Student

Community

Trust indicators are extremely important.

9. POSTS

Users should be able to create posts.

A post can contain:

Text

Images

Optional category

School

Faculty

Department

Level

Created date

Categories could include:

General

Academics

Exams

Registration

Hostel

Events

Opportunities

Campus Life

Question

Announcement

Users should be able to:

Like/react

Comment

Share/copy link

Save

Report

Users should be able to delete their own posts.

Admins should be able to moderate any post.

10. COMMENTS

Implement a proper comment system.

Comments should support:

Create

Read

Delete own comment

Like/react

Report

Reply to comments if the architecture supports nested comments

Show:

User avatar

Name

Verification badge where applicable

Timestamp

Comment text

Interaction controls

Do not use email addresses as avatar placeholders.

Users should have proper profile avatars.

Use Supabase Storage for uploaded profile pictures.

11. USER PROFILES

Every user should have a profile.

Profile should include:

Avatar

Full name

Username

School

Faculty

Department

Level

Role

Bio

Joined date

Posts

Questions/activity

Users should be able to edit:

Avatar

Name

Username

Bio

Academic information

Do not expose sensitive account information publicly.

12. AI CAMPUS ASSISTANT

This is one of CampusTruth's major differentiators.

Create an AI assistant specifically designed for campus-related questions.

The assistant should NOT behave like a generic ChatGPT clone.

It should be grounded in verified CampusTruth information.

Students can ask things like:

"When does registration close?"

"What documents do I need?"

"When are exams?"

"How much are school fees?"

"Where can I contact the department?"

"What did the latest school announcement say?"

"Explain this school policy to me."

"When does the semester begin?"

The AI should retrieve relevant verified campus information before generating an answer.

Architecture:

User question
→ Authenticate user
→ Check available AI credits
→ Retrieve relevant verified information
→ Build context
→ Send context + question to AI
→ Generate answer
→ Return answer
→ Save conversation
→ Deduct credit

The AI should prioritize official sources.

If the system cannot confidently answer:

Do not hallucinate.

Instead say something like:

"I couldn't find a verified source for that information yet."

Then optionally direct the user to relevant official information.

Every answer should ideally show its source.

Example:

Source
University of Lagos
Academic Calendar
Updated: September 2026

This is extremely important to CampusTruth's identity.

13. AI CHAT EXPERIENCE

Create a polished chat interface.

Include:

Conversation list

New conversation

Message bubbles

Loading state

Typing/generation state

Suggested questions

Source references

Copy answer

Regenerate

Report incorrect answer

Credit indicator

Suggested prompts:

"What's the latest school update?"

"When does registration close?"

"Explain the academic calendar."

"What do I need for course registration?"

Make the AI feel like a Campus Assistant, not just a generic chatbot.

14. CREDIT SYSTEM

Use a credit-based model for AI usage.

Students receive some free credits initially.

Credits should be visible in the UI.

Example:

24 credits remaining

Users can purchase additional credit packs later.

Do NOT put critical school information behind credits.

Basic campus information, official announcements, and normal browsing should remain accessible.

Credits are primarily for AI/premium computational features.

Database concepts:

credits

user_id

balance

updated_at

credit_transactions

id

user_id

amount

type

description

created_at

Transaction types could include:

welcome_bonus

ai_usage

purchase

admin_adjustment

refund

Make the credit system transactional and prevent negative balances.

15. Q&A

Create a dedicated student Q&A section.

Students can ask questions such as:

"Has anyone received their course registration approval?"

"How do I change my department?"

"Where is the faculty office?"

Other students can answer.

Questions should include:

title/question

author

school

faculty

department

level

timestamp

answers

views

helpful/upvotes

Allow users to mark an answer as helpful/best answer.

Verified representatives and trusted users can receive visual indicators.

16. COMMUNITIES

Create school communities.

Initial hierarchy:

UNILAG

→ Faculties

→ Departments

→ Levels

Users can discover communities relevant to them.

Examples:

Computer Engineering

100 Level

Faculty of Engineering

Community pages can contain:

posts

discussions

announcements

questions

members

Keep the first version simple.

Do not build complicated Discord-style functionality.

17. SEARCH

Implement global search.

Users should be able to search:

Posts

Questions

Users

Communities

Announcements

Verified campus information

Search should return useful results with filters.

Possible filters:

All

Posts

Questions

Announcements

Communities

The search experience should be fast and mobile friendly.

18. NOTIFICATIONS

Create a notification system.

Notify users when:

Someone comments on their post

Someone replies to their comment

Someone answers their question

Their question receives an answer

Their post receives engagement

A relevant official announcement is published

A representative posts in their community

Their account gets verified

Important school information changes

Users should be able to:

mark notifications as read

mark all as read

Show unread notification count.

19. SAVED CONTENT

Allow users to save useful:

Posts

Questions

Announcements

AI answers

Create a Saved section in the user's profile/dashboard.

This is useful because students may want to return to important school information later.

20. VERIFIED INFORMATION SYSTEM

This is critical.

CampusTruth should distinguish between:

Official / Verified information

Information confirmed by CampusTruth administrators or trusted official sources.

Community information

Information submitted by students.

Representative information

Information posted by verified course/faculty representatives.

The UI should make this distinction obvious.

Example badges:

✓ Verified

Official

Course Rep

Student

Do not make all content look equally authoritative.

21. ADMIN DASHBOARD

Build an admin dashboard.

Admin should be able to manage:

Users

View users

Search users

Change roles

Verify representatives

Suspend users

Posts

View posts

Approve

Remove

Flag

Review reports

Questions

Moderate questions

Remove inappropriate content

Announcements

Create

Edit

Delete

Publish

Mark as verified

Communities

Create schools

Faculties

Departments

Levels

AI knowledge

Admins should be able to manage verified information used by the AI.

Knowledge records could contain:

title

content

source URL

source name

school

category

published date

updated date

verified status

This becomes the foundation of the AI retrieval system.

22. CONTENT SOURCES

CampusTruth should eventually collect information from official school sources.

For the first version, prioritize a manually managed verified knowledge base.

Later, support ingestion from:

official university website

official school announcements

official faculty pages

official department pages

verified social media sources

Do not build an unnecessarily complicated scraping system for the MVP.

Create the architecture so that a scraping/ingestion system can be added later.

23. REPORTING AND MODERATION

Users must be able to report:

Posts

Comments

Questions

Answers

Users

Incorrect AI responses

Report reasons:

Spam

Harassment

False information

Offensive content

Impersonation

Other

Reports should enter an admin moderation queue.

Admins can:

review

dismiss

remove content

suspend user

mark as resolved

Trust and misinformation prevention are core features, not optional extras.

24. DATABASE

Use Supabase PostgreSQL.

Design a clean relational schema.

At minimum, create tables similar to:

profiles

id

username

full_name

avatar_url

bio

school_id

faculty_id

department_id

level

role

verified

created_at

updated_at

schools

id

name

slug

logo_url

description

created_at

faculties

id

school_id

name

slug

departments

id

faculty_id

name

slug

posts

id

author_id

school_id

faculty_id

department_id

level

title

content

category

verified

created_at

updated_at

comments

id

post_id

author_id

parent_id

content

created_at

reactions

id

user_id

post_id

type

created_at

questions

id

author_id

school_id

faculty_id

department_id

level

title

content

created_at

updated_at

answers

id

question_id

author_id

content

is_best

created_at

announcements

id

school_id

title

content

source_name

source_url

verified

published_at

created_at

communities

id

school_id

faculty_id

department_id

level

name

description

created_at

community_members

community_id

user_id

joined_at

conversations

id

user_id

title

created_at

updated_at

messages

id

conversation_id

role

content

sources

created_at

credits

user_id

balance

updated_at

credit_transactions

id

user_id

amount

type

description

created_at

notifications

id

user_id

type

title

message

read

related_id

created_at

saved_items

id

user_id

item_type

item_id

created_at

reports

id

reporter_id

target_type

target_id

reason

status

created_at

resolved_at

knowledge_sources

id

school_id

title

content

source_name

source_url

category

verified

published_at

updated_at

Use appropriate foreign keys and indexes.

25. SUPABASE SECURITY

Use Supabase Row Level Security properly.

Users should only be able to:

modify their own profile

delete their own posts

delete their own comments

manage their own saved items

access their own private AI conversations

access their own credit records

Admins should have elevated permissions through secure server-side logic.

Never expose Supabase service-role keys to the client.

Do not trust client-side role checks alone.

All sensitive operations should be validated server-side.

26. FILE STORAGE

Use Supabase Storage for:

profile avatars

post images

future attachments

Validate:

file type

file size

Optimize images before displaying them where possible.

27. EMPTY STATES

Every major page should have a useful empty state.

Examples:

No posts yet.

No questions yet.

No notifications.

No saved content.

No search results.

No conversations.

Empty states should still look polished and intentional.

28. LOADING STATES

Do not show blank screens while data loads.

Use:

skeleton loaders

loading indicators

optimistic UI where appropriate

The application should feel fast.

29. ERROR HANDLING

Handle:

failed API requests

failed database operations

authentication errors

AI failures

insufficient credits

upload failures

network errors

Errors should be human-readable.

Never expose raw database errors to users.

30. ACCESSIBILITY

Implement:

semantic HTML

keyboard navigation

accessible buttons

proper labels

adequate contrast

screen-reader-friendly forms

visible focus states

31. PERFORMANCE

Optimize for real-world student devices and Nigerian internet conditions.

Avoid unnecessary heavy libraries.

Use:

lazy loading

optimized images

pagination/infinite scrolling where appropriate

server-side data fetching where useful

caching where appropriate

Do not make every page depend on large client-side JavaScript bundles.

32. NAVIGATION

The exact navigation should follow the Figma designs where provided.

The application should provide easy access to the major areas:

Home / Feed

AI Assistant

Q&A

Communities

Notifications

Profile

On desktop, use an appropriate sidebar/navigation system if consistent with the Figma design.

On mobile, use a bottom navigation or mobile navigation pattern consistent with the existing design.

33. PROFILE MENU / SETTINGS

Include settings for:

Account

Name

Username

Email

Avatar

Academic profile

School

Faculty

Department

Level

Notifications

Notification preferences

Privacy

Profile visibility

Appearance

Light/dark/system if supported by the design

Account actions

Logout

Delete account

34. TRUST FEATURES

CampusTruth's most important product principle is trust.

Build visual trust signals throughout the application.

Examples:

✓ Verified information

✓ Official source

✓ Verified course representative

✓ Trusted answer

Source links should be visible when information comes from an external source.

Do not make unsupported claims that information is official.

35. AI SAFETY / ACCURACY

The AI must never confidently invent:

dates

fees

policies

school announcements

contacts

deadlines

academic requirements

If no reliable information exists, clearly state that the information could not be verified.

The system should prefer:

Official sources

CampusTruth verified sources

Verified representative information

Community information

Community information should never automatically become "official."

36. ANALYTICS

Prepare the application for basic product analytics.

Track useful events such as:

signup

login

post_created

post_viewed

question_created

answer_created

ai_question

ai_answer

credit_used

credit_purchase

community_joined

Do not collect unnecessary sensitive information.

37. MVP PRIORITY

Do not attempt to build every future feature before the core product works.

Prioritize:

PHASE 1 — CORE

Landing page

Authentication

Onboarding

Feed

Posts

Comments

Profiles

Search

Notifications

Q&A

PHASE 2 — DIFFERENTIATOR

AI Campus Assistant

Verified knowledge base

Credits

Sources/citations

Communities

PHASE 3 — OPERATIONS

Admin dashboard

Moderation

Reports

Course-rep verification

Content management

Build the architecture so future features can be added without rewriting the application.

38. IMPORTANT PRODUCT RULES

Do NOT:

turn CampusTruth into a generic social network

hide important school information behind payments

allow users to claim official status themselves

fabricate school information

make AI answers appear authoritative without sources

overcomplicate the MVP

create unnecessary features just because they are technically possible

ignore mobile responsiveness

replace the existing Figma design with a completely different design

DO:

prioritize trust

prioritize usability

make information easy to find

make important information easy to understand

clearly distinguish verified vs community content

make the application feel fast

keep the interface clean

use reusable components

write maintainable code

keep the database scalable

make the architecture multi-school ready

39. TECH STACK

Use:

Next.js

TypeScript

React

Tailwind CSS

Supabase

Supabase Auth

Supabase PostgreSQL

Supabase Storage

Use server-side functionality/API routes where appropriate.

Keep the architecture compatible with deployment on Vercel.

Do not introduce unnecessary backend infrastructure if Supabase and Next.js can handle the requirement.

40. COMPONENT ARCHITECTURE

Create reusable components rather than duplicating UI.

Examples:

Navbar

Sidebar

MobileNavigation

PostCard

CommentSection

CommentItem

UserAvatar

VerificationBadge

NotificationItem

QuestionCard

AnswerCard

CommunityCard

SourceCard

ChatMessage

ChatInput

CreditBadge

SearchBar

EmptyState

LoadingSkeleton

Modal

Dropdown

Button

Input

Toast

Keep components modular and easy to maintain.

41. DESIGN IMPLEMENTATION RULE

The Figma designs provided to you are not merely inspiration.

They represent the intended visual identity.

For screens represented in the Figma:

Follow them closely.

For screens that are missing:

Infer the design system from the provided screens and extend it consistently.

Do not create visually unrelated pages.

The entire application should look like one cohesive product.

42. DATA-FIRST DEVELOPMENT

Do not build a fake frontend using hardcoded data and stop there.

Use real Supabase data.

The user should be able to:

Create an account

Complete onboarding

View their personalized feed

Create a post

Comment

Ask a question

Answer questions

Save content

Receive notifications

Update their profile

Use the AI assistant

See their credits

Access relevant communities

The application should function as a real product.

Use realistic seed/demo data only where necessary to make the initial experience useful.

43. FINAL QUALITY BAR

Before considering the build complete, verify:

Authentication works

Protected routes work

Users can create posts

Posts persist in Supabase

Comments persist

Profiles work

Search works

Q&A works

Notifications work

AI chat works through a secure server-side flow

Credit deductions work correctly

Verified information is distinguishable

Admin functionality is protected

RLS policies are correctly implemented

Mobile UI works

Desktop UI works

Loading states work

Error states work

Empty states work

No obvious console errors

No exposed secrets

No broken navigation

No fake buttons that do nothing

44. BUILD PHILOSOPHY

Build CampusTruth as if this is going to be launched publicly.

Do not create a prototype that only looks good in screenshots.

Every major interaction should have a real underlying implementation.

At the same time, avoid unnecessary complexity.

The goal is:

Simple enough to launch quickly.
Strong enough to become a real product.
Flexible enough to scale to other universities.

CampusTruth should ultimately become the place students think of first when they need reliable information about their school.

Start with UNILAG.

Get the foundation right.

Then scale.

CAMPUS TRUTH

Know your campus.
Trust your information.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://campustruth.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6678244c-6241-4439-99cc-bc02d32b847b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
