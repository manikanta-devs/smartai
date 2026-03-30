# DATA COMPLIANCE CHECKLIST

**For:** Career OS Development Team  
**Purpose:** Ensure all code/features comply with T&C and Privacy Policy  
**Last Updated:** March 30, 2026

---

## ✅ FRONTEND COMPLIANCE

### Login & Authentication
- [ ] Password hashed with bcrypt (never stored plain)
- [ ] JWT tokens used (no session cookies)
- [ ] Auto-logout after 30 min inactivity
- [ ] "Remember Me" disabled by default
- [ ] Login attempt throttling (3 tries, then 5 min cooldown)
- [ ] No password requirements shown as asterisks that save
- [ ] CSRF tokens on all forms

### Data Collection
- [ ] Minimum data requested (only what's needed)
- [ ] Optional fields marked as "Optional"
- [ ] No pre-checked consent boxes
- [ ] Privacy policy link in signup
- [ ] T&C link in signup
- [ ] Explicit opt-in for emails
- [ ] Clear purpose for each data field

### Profile & Resume Upload
- [ ] User can see all their data
- [ ] Edit button for every field
- [ ] Delete button for resumes
- [ ] Preview before upload
- [ ] File type validation (PDF only initially)
- [ ] File size limits (max 5MB)
- [ ] User owns the content (displayed in UI)
- [ ] Can delete account anytime

### Analytics & Tracking
- [ ] Google Analytics anonymized (no user IDs)
- [ ] Do Not Track respected (disable analytics if enabled)
- [ ] Cookie banner on first visit
- [ ] Opt-in required for analytics cookies
- [ ] Clear cookie settings in preferences
- [ ] No cross-site tracking
- [ ] No fingerprinting

### Job Applications
- [ ] Show confirmation before applying
- [ ] Track: when applied, from which source
- [ ] Allow withdrawal of application
- [ ] Show status history
- [ ] Note: Employer also tracks the data

---

## ✅ BACKEND COMPLIANCE

### Database
- [ ] Never store passwords in plain text
- [ ] Never store credit card data (leave to payment processor)
- [ ] Never store API keys in database (use env vars)
- [ ] Encrypted sensitive fields (SSN, phone, etc.)
- [ ] Add created_at, updated_at timestamps
- [ ] Add deleted_at (soft delete option)
- [ ] Foreign keys to enforce relationships
- [ ] Indexes on frequently queried fields

### User Deletion
- [ ] DELETE /api/user/{id} endpoint
- [ ] Soft delete (mark deleted, keep 30 days)
- [ ] Hard delete (after 30 days for compliance)
- [ ] Archive to separate retention db
- [ ] Delete associated applications
- [ ] Delete associated resumes
- [ ] No trace in analytics
- [ ] Confirmation email sent
- [ ] Cannot undo after 30 days

### Data Export
- [ ] GET /api/user/export endpoint
- [ ] JSON format with all user data
- [ ] Includes all resumes
- [ ] Includes all applications
- [ ] Includes all preferences
- [ ] Downloadable as ZIP
- [ ] Timestamp included
- [ ] Only works if authenticated

### API Security
- [ ] All endpoints require authentication (JWT)
- [ ] Rate limiting (100 req/min per user)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize outputs)
- [ ] CORS restricted to frontend domain only
- [ ] API keys in headers (not URL)
- [ ] Log all data access (audit trail)

### Logging & Monitoring
- [ ] Log all data access (who, what, when)
- [ ] Log all deletions (retention: 1 year)
- [ ] Log all failures (retention: 90 days)
- [ ] Never log passwords
- [ ] Never log full credit card numbers
- [ ] Never log full SSN/PAN
- [ ] Secure log storage (encrypted)
- [ ] Alert on suspicious activity

---

## ✅ AI & GEMINI COMPLIANCE

### API Calls
- [ ] No PII sent to Gemini unless necessary
- [ ] Anonymize where possible
- [ ] Add data retention: Gemini deletes after 24h
- [ ] Document what data is sent
- [ ] Get user consent for AI features
- [ ] Allow opt-out of AI
- [ ] Clear in UI: "AI-generated, may contain errors"
- [ ] Disclose: "Powered by Google Gemini"

### Data Handling
- [ ] Resume text sent (not attachments usually)
- [ ] Name removed before sending to AI
- [ ] Email removed before sending to AI
- [ ] Phone removed before sending to AI
- [ ] Only relevant parts sent (not full file)
- [ ] Results shown to user only
- [ ] Results not stored permanently
- [ ] Never use for model training without consent

### Model Improvements
- [ ] Aggregate thousands of samples
- [ ] Remove all PII first
- [ ] Only show patterns, not individuals
- [ ] Cannot identify anyone in reports
- [ ] User cannot object to analytics

---

## ✅ THIRD-PARTY COMPLIANCE

### Job Boards
- [ ] Naukri: Third-party T&C apply
- [ ] Indeed: Third-party T&C apply
- [ ] LinkedIn: Third-party T&C apply
- [ ] Internshala: Third-party T&C apply
- [ ] InstaHyre: Third-party T&C apply
- [ ] Disclaimer on each link
- [ ] "External link" badge shown
- [ ] User warned: you'll go to external site
- [ ] Career OS not liable for third parties

### API Integrations
- [ ] API keys stored in .env (never in code)
- [ ] Rate limiting respected
- [ ] Errors handled gracefully
- [ ] Data processing agreements in place
- [ ] Cache data where allowed
- [ ] Respect CORS headers
- [ ] Follow API T&Cs completely

---

## ✅ SECURITY COMPLIANCE

### Encryption
- [ ] HTTPS/TLS for all connections
- [ ] Certificate valid and renewed annually
- [ ] Strong protocols: TLS 1.2+ only
- [ ] Sensitive data encrypted at rest
- [ ] Passwords hashed with bcrypt (rounds: 10+)
- [ ] API keys hashed before storage
- [ ] Old encryption keys rotated annually

### Access Control
- [ ] Users can only see own data
- [ ] Admins can see all data
- [ ] Super-admin role exists
- [ ] Role-based access (RBAC)
- [ ] Principle of least privilege
- [ ] Admin actions logged
- [ ] Cannot bypass auth
- [ ] Cannot access other user data

### Infrastructure
- [ ] Firewall enabled
- [ ] DDoS protection
- [ ] Regular security updates
- [ ] Dependency scanning (npm audit)
- [ ] No console.log() in production (leaks data)
- [ ] Error handling doesn't expose internals
- [ ] Backup encryption enabled
- [ ] Disaster recovery plan documented

---

## ✅ BREACH RESPONSE COMPLIANCE

### If Data Breach Occurs
- [ ] Stop the attack immediately
- [ ] Document everything
- [ ] Assess scope (what, who, how much)
- [ ] Preserve evidence (logs, files)
- [ ] Notify affected users (24-48 hours)
- [ ] Email details: what happened, actions taken
- [ ] Notify authorities if required
- [ ] Offer free credit monitoring
- [ ] Public statement on website
- [ ] Post-mortem analysis
- [ ] Prevent recurrence

### Investigation Template
```
Breach Incident Report
- Date/Time Discovered: ___
- Date/Time Occurred: ___
- Duration: ___
- Root Cause: ___
- Data Affected: ___
- Users Affected: ___
- Remediation Steps: ___
- Prevention: ___
- Legal Notification: ___
```

---

## ✅ DEPLOYMENT COMPLIANCE

### Before Going Live
- [ ] Privacy policy completed
- [ ] Terms and conditions completed
- [ ] Data handling procedures documented
- [ ] Security audit completed
- [ ] Code review completed
- [ ] No hardcoded secrets in code
- [ ] .env file properly configured
- [ ] SSL certificate installed
- [ ] Backups tested
- [ ] Monitoring configured

### During Deployment
- [ ] Zero-downtime deployment (if possible)
- [ ] Database backed up before migration
- [ ] Rollback procedure ready
- [ ] Page load time < 3 seconds
- [ ] Error tracking enabled
- [ ] Alert system active
- [ ] On-call support available

### After Deployment
- [ ] Monitor logs 24/7 for first week
- [ ] Test all critical user flows
- [ ] Check no data is exposed
- [ ] Verify encryption working
- [ ] Confirm backups running
- [ ] Update status page
- [ ] Announce on social media
- [ ] Gather user feedback

---

## ✅ ONGOING COMPLIANCE

### Daily/Weekly
- [ ] Monitor error logs
- [ ] Check backup completion
- [ ] Verify payment processing (if any)
- [ ] Review security alerts
- [ ] Respond to support tickets

### Monthly
- [ ] Audit user data access
- [ ] Review deleted accounts
- [ ] Update dependencies
- [ ] Analyze usage patterns
- [ ] Check compliance with T&C

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Code review for compliance
- [ ] Update privacy policy if needed
- [ ] Update T&C if needed

### Annually
- [ ] Full security assessment
- [ ] Rotate encryption keys
- [ ] Update SSL certificate
- [ ] Legal review
- [ ] Disaster recovery drill

---

## ✅ TESTING COMPLIANCE

### Unit Tests
```javascript
// Test: Password hashing
test('passwords are hashed', () => {
  const plainPassword = 'TestPass123!';
  const hashed = hashPassword(plainPassword);
  expect(hashed).not.toBe(plainPassword);
  expect(verifyPassword(plainPassword, hashed)).toBe(true);
});

// Test: User cannot see others' data
test('user cannot view other user data', async () => {
  const user1 = await getUserById(1);
  const user2 = await getUserById(2);
  expect(user1.resumes[0]).not.toEqual(user2.resumes[0]);
});
```

### Integration Tests
```javascript
// Test: Complete user data deletion
test('delete user removes all data', async () => {
  const user = await createUser({email: 'test@test.com'});
  await deleteUser(user.id);
  const retrieved = await getUserById(user.id);
  expect(retrieved).toBe(null);
});

// Test: Export user data
test('export returns all user data', async () => {
  const exported = await exportUserData(userId);
  expect(exported).toHaveProperty('profile');
  expect(exported).toHaveProperty('resumes');
  expect(exported).toHaveProperty('applications');
});
```

### E2E Tests
- [ ] Sign up → Privacy acceptance flows
- [ ] Upload resume → Data stored correctly
- [ ] Apply to job → Data not exposed
- [ ] Delete account → Full cleanup verified
- [ ] Export data → All data present

---

## 📋 COMPLIANCE SIGN-OFF

### For Developers
```
[ ] I have implemented all necessary security measures
[ ] I have tested user data isolation
[ ] I have verified no data leaks
[ ] I have documented data handling
[ ] I have reviewed T&C compliance
```

### For QA
```
[ ] I have tested all privacy features
[ ] I have verified deletion works
[ ] I have tested export functionality
[ ] I have verified encryption
[ ] I have confirmed T&C compliance
```

### For Legal
```
[ ] Privacy Policy approved
[ ] Terms and Conditions approved
[ ] Data handling procedures approved
[ ] Security measures adequate
[ ] Recommended for launch
```

### For Operations
```
[ ] Monitoring configured
[ ] Alerting configured
[ ] Backups working
[ ] Disaster recovery tested
[ ] On-call support ready
```

---

## 🔒 SECURITY CHECKLIST SUMMARY

✅ **Encryption:** All data encrypted in transit and at rest  
✅ **Authentication:** JWT tokens, auto-logout  
✅ **Authorization:** Role-based access control  
✅ **Input Validation:** All inputs validated  
✅ **Logging:** All actions logged and audited  
✅ **Backups:** Daily encrypted backups  
✅ **Monitoring:** 24/7 security monitoring  
✅ **Incident Response:** Breach protocol documented  
✅ **User Rights:** Export, delete, correction available  
✅ **Third Parties:** Properly disclosed and managed  

---

## 🚨 RED FLAGS - NEVER DO

❌ Store passwords in plain text  
❌ Send PII to random APIs  
❌ Use default database credentials  
❌ Commit secrets to GitHub  
❌ Log sensitive data  
❌ Allow SQL injection  
❌ Mix user data  
❌ Disable HTTPS  
❌ Skip backups  
❌ Ignore security warnings  

---

## 📞 CONTACT

- **Legal Questions:** legal@careerOS.com
- **Privacy Questions:** privacy@careerOS.com
- **Security Issues:** security@careerOS.com
- **Compliance Issues:** compliance@careerOS.com

---

**This checklist is mandatory for all Career OS developers.**

**Last Updated:** March 30, 2026

---

*Remember: User trust is our most valuable asset. Protect it.*
