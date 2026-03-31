# GEO Audit Report: Studio Chenille

**Audit Date:** 2026-03-31
**URL:** https://studiochenille.com
**Business Type:** Local Business / Interior Design Agency
**Pages Analyzed:** 31

---

## Executive Summary

**Overall GEO Score: 39/100 (Poor)**

Studio Chenille has strong technical foundations -- static HTML (perfect for AI crawlers), valid schema markup across 30 pages, and a fully permissive robots.txt. However, the site suffers from two critical weaknesses: **zero third-party brand presence** (no Google Business Profile, no Houzz, no LinkedIn, no reviews) and **content that is marketing-first with no citable data** (no stats, no real testimonials, no case studies, no named team members). These are the issues that matter most for AI visibility.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 48/100 | 25% | 12.0 |
| Brand Authority | 5/100 | 20% | 1.0 |
| Content E-E-A-T | 38/100 | 20% | 7.6 |
| Technical GEO | 70/100 | 15% | 10.5 |
| Schema & Structured Data | 32/100 | 10% | 3.2 |
| Platform Optimization | 48/100 | 10% | 4.8 |
| **Overall GEO Score** | | | **39.1/100** |

### Platform Readiness

| Platform | Score | Status |
|---|---|---|
| Google AI Overviews | 62/100 | Fair |
| Google Gemini | 52/100 | Fair |
| Bing Copilot | 42/100 | Poor |
| Perplexity AI | 38/100 | Poor |
| ChatGPT Web Search | 35/100 | Poor |

---

## Critical Issues (Fix Immediately)

1. **Sitemap URL mismatch** -- 20 area page URLs use `/areas/ascot.html` format but actual files are `interior-design-ascot.html`. All area pages return 404 via sitemap.
2. **Empty sameAs array** -- Schema markup has `"sameAs": []` with zero platform links. AI models cannot verify the entity exists.
3. **Zero brand presence** -- No Google Business Profile, Houzz, LinkedIn, or any third-party listing.
4. **No real testimonials** -- Placeholder section with no actual client reviews.
5. **No named team members** -- No Person schema, no author bios, no credentials anywhere.

## High Priority Issues

6. **No llms.txt file** -- FIXED during this audit session.
7. **Missing security headers** -- No HSTS, CSP, X-Frame-Options in .htaccess.
8. **Blog link broken** -- Footer links to blog.html which doesn't exist.
9. **Social links are placeholders** -- Instagram, Pinterest, LinkedIn all point to `#`.
10. **Copyright year outdated** -- Shows 2024, should be 2026.
11. **Meta description too long** -- 195 chars, should be under 160.
12. **No HowTo schema** on 7-step process section.
13. **GA4 commented out** -- No analytics tracking active.

## Medium Priority Issues

14. **No publication/modification dates** visible on any page.
15. **Service/location pages thin** -- 350-550 words each, should be 800-1200.
16. **No external citations** -- Zero outbound links to industry bodies, suppliers, or authorities.
17. **lang="en"** should be **lang="en-GB"** for UK business.
18. **Images lack width/height** attributes (CLS risk).
19. **No IndexNow** implementation for Bing.
20. **OG image uses relative path** instead of absolute URL.

## Low Priority Issues

21. **No preload hints** for hero image or critical CSS.
22. **No 404 page** -- 404s serve index.html (duplicate content risk).
23. **Web manifest missing icons** array.
24. **AI content signals** -- Content reads as template-generated, lacks unique voice.

---

## Quick Wins (Implement This Week)

1. Fix sitemap.xml URLs (20 broken area page references)
2. Update copyright year to 2026
3. Add security headers to .htaccess
4. Remove broken blog.html link from footer
5. Change lang="en" to lang="en-GB"
6. Fix OG image to absolute URL
7. Trim meta description to 155 chars
8. Add explicit AI crawler rules to robots.txt

## 30-Day Action Plan

### Week 1: Technical Fixes
- [ ] Fix all sitemap URLs
- [ ] Add security headers
- [ ] Create proper 404.html page
- [ ] Update robots.txt with AI crawler rules
- [ ] Fix all placeholder social links (remove or connect)
- [ ] Add width/height to all images
- [ ] Activate GA4 tracking

### Week 2: Brand Presence
- [ ] Create Google Business Profile
- [ ] Create Houzz profile with project photos
- [ ] Create LinkedIn company page
- [ ] Create Instagram business account
- [ ] Populate sameAs array with all profile URLs

### Week 3: Content & E-E-A-T
- [ ] Add founder/designer profile with credentials to about page
- [ ] Add Person schema for team members
- [ ] Add 3-5 real client testimonials
- [ ] Add founding year, project count, and team size to content
- [ ] Expand service pages to 800+ words each

### Week 4: Advanced GEO
- [ ] Create blog.html with 3 initial articles
- [ ] Add HowTo schema to 7-step process
- [ ] Add case study for at least one real project
- [ ] Implement IndexNow for Bing
- [ ] Submit to BIID/SBID directories
