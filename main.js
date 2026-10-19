document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. UNIFIED FLOATING DARK MODE TOGGLE (GLOBAL ACROSS ALL PAGES)
       ========================================================================== */
    const existingBtns = document.querySelectorAll('#theme-toggle, .theme-toggle-btn');
    existingBtns.forEach(btn => btn.remove());

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
    document.body.appendChild(toggleBtn);

    const moonIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const sunIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.innerHTML = sunIcon;
    } else {
        document.body.classList.remove('dark-mode');
        toggleBtn.innerHTML = moonIcon;
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        toggleBtn.innerHTML = isDark ? sunIcon : moonIcon;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    /* ==========================================================================
       2. DYNAMIC DOCTOR SCHEDULE & APPOINTMENT BOOKING SYSTEM
       ========================================================================== */

    // Doctor working profiles mapping (days: 0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const doctorProfiles = {
        "Dr. Sarah Johnson": {
            days: [1, 3, 5], // Mon, Wed, Fri
            dayNames: "Mon, Wed, Fri",
            startHour: 8,   // 08:00 AM
            endHour: 16     // 04:00 PM
        },
        "Dr. Robert Wilson": {
            days: [2, 4, 6], // Tue, Thu, Sat
            dayNames: "Tue, Thu, Sat",
            startHour: 10,  // 10:00 AM
            endHour: 18     // 06:00 PM
        },
        "Dr. Michael Chen": {
            days: [1, 2, 3, 4, 5, 6], // Mon - Sat (Daily except Sunday)
            dayNames: "Daily except Sunday",
            startHour: 9,   // 09:00 AM
            endHour: 17     // 05:00 PM
        },
        "Dr. Emily Davis": {
            days: [0, 2, 4], // Sun, Tue, Thu
            dayNames: "Sun, Tue, Thu",
            startHour: 8,   // 08:00 AM
            endHour: 14     // 02:00 PM
        }
    };

    const bookingForm = document.getElementById('appointmentForm');
    const alertBox = document.getElementById('bookingAlert');
    const doctorSelect = document.getElementById('doctorSelect');
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');

    // Configure allowed date selection range (from today up to 30 days ahead)
    if (dateInput) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 30);
        dateInput.setAttribute('min', today.toISOString().split('T')[0]);
        dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    }

    // Master clinic time slots (trimmed up to 6:00 PM to match maximum doctor hours)
    const masterTimeSlots = [
        { label: "08:00 AM - 09:00 AM", start: 8 },
        { label: "09:00 AM - 10:00 AM", start: 9 },
        { label: "10:00 AM - 11:00 AM", start: 10 },
        { label: "11:00 AM - 12:00 PM", start: 11 },
        { label: "12:00 PM - 01:00 PM", start: 12 },
        { label: "01:00 PM - 02:00 PM", start: 13 },
        { label: "02:00 PM - 03:00 PM", start: 14 },
        { label: "03:00 PM - 04:00 PM", start: 15 },
        { label: "04:00 PM - 05:00 PM", start: 16 },
        { label: "05:00 PM - 06:00 PM", start: 17 }
    ];

    // Function to validate chosen working day and populate available time slots dynamically
    function validateAndPopulateSlots() {
        if (!doctorSelect || !dateInput || !timeSelect) return;

        const doctorName = doctorSelect.value;
        const selectedDateVal = dateInput.value;
        const profile = doctorProfiles[doctorName];

        if (alertBox) alertBox.innerHTML = '';

        // 1. Verify if selected date matches doctor's working days
        if (selectedDateVal && profile) {
            const parts = selectedDateVal.split('-');
            const chosenDate = new Date(parts[0], parts[1] - 1, parts[2]);
            const dayOfWeek = chosenDate.getDay();

            if (!profile.days.includes(dayOfWeek)) {
                showAlert(alertBox, `⚠️ ${doctorName} is available only on (${profile.dayNames}). Please choose a valid day.`, 'red');
                dateInput.value = '';
                timeSelect.innerHTML = `<option value="" disabled selected>-- Select Doctor & Valid Date First --</option>`;
                return;
            }
        }

        // 2. Populate time slots based on doctor working hours and existing bookings
        timeSelect.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        defaultOpt.textContent = '-- Select Time Slot --';
        timeSelect.appendChild(defaultOpt);

        if (!doctorName || !selectedDateVal || !profile) return;

        // Retrieve existing bookings from localStorage
        const allBookings = JSON.parse(localStorage.getItem('medcare_all_bookings')) || JSON.parse(localStorage.getItem('medcare_bookings')) || [];
        const bookedTimes = allBookings
            .filter(b => b.doctor === doctorName && b.date === selectedDateVal)
            .map(b => b.time);

        masterTimeSlots.forEach(slot => {
            if (slot.start >= profile.startHour && slot.start < profile.endHour) {
                const opt = document.createElement('option');
                opt.value = slot.label;

                if (bookedTimes.includes(slot.label)) {
                    opt.disabled = true;
                    opt.textContent = slot.label + ' ❌ (Already Booked)';
                } else {
                    opt.textContent = slot.label;
                }
                timeSelect.appendChild(opt);
            }
        });
    }

    if (doctorSelect) doctorSelect.addEventListener('change', validateAndPopulateSlots);
    if (dateInput) dateInput.addEventListener('change', validateAndPopulateSlots);

    // Handle appointment form submission and data persistence
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName')?.value.trim();
            const doctor = doctorSelect?.value;
            const date = dateInput ? dateInput.value : '';
            const timeSlot = timeSelect?.value;
            const selectedOpt = timeSelect?.options[timeSelect.selectedIndex];

            if (alertBox) alertBox.innerHTML = '';

            if (!fullName || !doctor || !date || !timeSlot) {
                showAlert(alertBox, 'Please fill in all required fields.', 'red');
                return;
            }

            if (selectedOpt && selectedOpt.disabled) {
                showAlert(alertBox, '⚠️ Selected time slot is unavailable or already booked.', 'red');
                return;
            }

            const existingBookings = JSON.parse(localStorage.getItem('medcare_all_bookings')) || JSON.parse(localStorage.getItem('medcare_bookings')) || [];
            const isBooked = existingBookings.some(b => b.doctor === doctor && b.date === date && b.time === timeSlot);

            if (isBooked) {
                showAlert(alertBox, `⚠️ Sorry, ${doctor} is already booked for (${timeSlot}) on ${date}.`, 'red');
                validateAndPopulateSlots();
            } else {
                const newBooking = { fullName, patientName: fullName, doctor, date, time: timeSlot };
                existingBookings.push(newBooking);

                // Save booking data to all required storage keys for seamless cross-page persistence
                localStorage.setItem('medcare_all_bookings', JSON.stringify(existingBookings));
                localStorage.setItem('medcare_bookings', JSON.stringify(existingBookings));
                localStorage.setItem('latestBooking', JSON.stringify(newBooking));

                showAlert(alertBox, '✔ Booking confirmed! Redirecting...', 'green');
                setTimeout(() => {
                    window.location.href = 'confirmation.html';
                }, 800);
            }
        });
    }

    /* ==========================================================================
       3. CONTACT FORM HANDLER
       ========================================================================== */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const oldMsg = document.getElementById('form-alert');
            if (oldMsg) oldMsg.remove();

            const alert = document.createElement('div');
            alert.id = 'form-alert';
            alert.style.cssText = 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb; padding: 12px 15px; border-radius: 6px; margin-top: 15px; text-align: center; font-size: 0.95rem; font-weight: 500; transition: all 0.3s ease;';
            alert.innerHTML = '✔ Thank you! Your message has been sent successfully.';

            contactForm.appendChild(alert);
            contactForm.reset();

            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        });
    }

    /* ==========================================================================
       4. PRE-SELECTED DOCTOR INTEGRATION (PROPERLY SCOPED)
       ========================================================================== */
    const autoSelectedDoctor = localStorage.getItem('selectedDoctorForBooking');
    if (autoSelectedDoctor && doctorSelect) {
        doctorSelect.value = autoSelectedDoctor;
        localStorage.removeItem('selectedDoctorForBooking'); // Clean up storage after applying
        validateAndPopulateSlots();
    }
});

/* ==========================================================================
   5. GLOBAL HELPER FUNCTIONS
   ========================================================================== */

// Helper function to display alert messages inside forms
function showAlert(element, text, type) {
    if (!element) return;
    const isRed = type === 'red';
    element.innerHTML = `<div style="background:${isRed ? '#f8d7da' : '#d4edda'}; color:${isRed ? '#721c24' : '#155724'}; border: 1px solid ${isRed ? '#f5c6cb' : '#c3e6cb'}; padding:12px; border-radius:8px; text-align:center; font-weight:500;">${text}</div>`;
}

// Global function to auto-select doctor from cards and smooth scroll to booking section
window.selectDoctorAndScroll = function(doctorName) {
    const doctorSelect = document.getElementById('doctorSelect');
    
    if (doctorSelect) {
        doctorSelect.value = doctorName;

        // Dispatch change event to trigger slot population
        const changeEvent = new Event('change', { bubbles: true });
        doctorSelect.dispatchEvent(changeEvent);

        // Smooth scroll to booking form section
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
};