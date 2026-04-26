# Django Migration TODO - expense-backend to Django + DRF + djongo

## Status: Phase 1 - Project Setup ✅ Starting

### Phase 1: Project Setup ✅ COMPLETE
- [x] Create Django project structure (manage.py, settings, apps: accounts/transactions/trips)
- [x] Django settings.py (Mongo djongo, DRF, JWT, CORS, email)
- [x] Update requirements.txt (Django/DRF/djongo/simplejwt + orig deps)
- [ ] Initial migrations setup

**Next Command**: `pip install -r backend/requirements.txt && cd backend && python manage.py makemigrations && python manage.py migrate`

### Phase 2: Models & Database ✅ COMPLETE
- [x] accounts/models.py: CustomUser (email/guest support)
- [x] transactions/models.py: Transaction model  
- [x] trips/models.py: Trip w/ Embedded Participant/Expense
- [ ] Run `cd backend && python manage.py makemigrations && python manage.py migrate`

### Phase 3: Serializers ✅ COMPLETE
- [x] accounts/serializers.py (Register/Login/Guest/JWT)
- [x] transactions/serializers.py (CRUD)
- [x] trips/serializers.py (Trip/Participant/Expense)

**Next: Phase 4 Views → After migrations**


### Phase 4: Views & URLs
- [ ] accounts/views.py: Register/Login/Guest/Forgot/Reset + JWT
- [ ] transactions/views.py: CRUD + summary/export/email
- [ ] trips/views.py: CRUD + settlement + export
- [ ] Main urls.py + app urls.py
- [ ] Utility functions (excel, emails)

### Phase 5: Testing & Deployment
- [ ] Test all endpoints (Postman/cURL)
- [ ] Remove FastAPI files (main.py, auth.py etc)
- [ ] Update docker-compose.yml/Dockerfile
- [ ] Update README.md
- [ ] ✅ Complete!

**Instructions**: AI will update this file after each phase/step completion.
**Run commands after Phase 1**: `cd backend && python manage.py migrate`

