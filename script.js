// Language Switching Logic
let currentLang = localStorage.getItem('lang') || 'pt'; // Default Portuguese

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial language
    setLanguage(currentLang);

    // Language dropdown toggle
    const langDropdownBtn = document.getElementById('langDropdownBtn');
    const langDropdown = document.getElementById('langDropdown');

    if (langDropdownBtn && langDropdown) {
        langDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (!langDropdown.classList.contains('hidden')) {
                langDropdown.classList.add('hidden');
            }
        });
    }

    // Language option click handlers
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedLang = option.getAttribute('data-lang');
            setLanguage(selectedLang);
            langDropdown.classList.add('hidden');
        });
    });
});

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', lang);

    // Update flag icon
    const currentFlag = document.getElementById('currentFlag');
    if (currentFlag) {
        currentFlag.textContent = lang === 'pt' ? '🇧🇷' : '🇪🇸';
    }

    // Apply translations to all elements with data-i18n
    if (window.translations && window.translations[lang]) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (window.translations[lang][key]) {
                // For input placeholders
                if (element.tagName === 'INPUT') {
                    element.placeholder = window.translations[lang][key];
                } else {
                    element.textContent = window.translations[lang][key];
                }
            }
        });

        // Update calendar day names (dynamic content)
        updateCalendarLanguage(lang);

        // Update WhatsApp links
        updateWhatsAppLinks(lang);
    }
}

function updateCalendarLanguage(lang) {
    // This will be called when calendar renders
    // The script.js calendar section will use translations[currentLang]
    window.currentCalendarLang = lang;

    // Re-render calendar if it's already loaded
    if (typeof updateWeekHeader === 'function') {
        updateWeekHeader();
        renderTimeSlots();
    }
}

function updateWhatsAppLinks(lang) {
    const floatingBtn = document.getElementById('whatsappFloating');
    const bookingBtn = document.getElementById('whatsappBookingBtn');

    if (floatingBtn && CONFIG.WHATSAPP_NUMBER && window.translations[lang]) {
        const message = window.translations[lang].whatsapp_default;
        floatingBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    if (bookingBtn && CONFIG.WHATSAPP_NUMBER && window.translations[lang]) {
        const message = window.translations[lang].whatsapp_calendar;
        bookingBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }
}

// Initialize WhatsApp links from CONFIG
document.addEventListener('DOMContentLoaded', () => {
    // Set floating WhatsApp button
    const floatingBtn = document.getElementById('whatsappFloating');
    if (floatingBtn && CONFIG.WHATSAPP_NUMBER) {
        floatingBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=Hola,%20quisiera%20reservar%20un%20paseo%20fotográfico.`;
    }

    // Set booking WhatsApp button initial state
    const bookingBtn = document.getElementById('whatsappBookingBtn');
    if (bookingBtn && CONFIG.WHATSAPP_NUMBER) {
        bookingBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=Hola,%20vi%20disponibilidad%20en%20el%20calendario%20y%20quiero%20reservar.`;
    }
});

// Carousel Logic (Infinite Reviews)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('carousel-container');
    if (!container) return;

    const track = document.getElementById('carousel-track');
    const originalCards = Array.from(track.querySelectorAll('.review-card'));

    // 1. DUPLICAR CONTENIDO (TRIPLE SET)
    track.innerHTML = '';
    const allCards = [
        ...originalCards.map(c => c.cloneNode(true)), // Clones Izquierda
        ...originalCards,                             // Originales (Centro)
        ...originalCards.map(c => c.cloneNode(true))  // Clones Derecha
    ];
    allCards.forEach(c => track.appendChild(c));

    // 2. POSICIONAMIENTO INICIAL
    const cardsNow = document.querySelectorAll('.review-card');
    const singleSetWidth = (cardsNow[0].offsetWidth + 32) * originalCards.length;
    const startPos = singleSetWidth + (cardsNow[0].offsetWidth / 2);
    container.scrollLeft = startPos - (container.offsetWidth / 2) + (cardsNow[0].offsetWidth / 2);

    // 3. LÓGICA DE BUCLE INFINITO
    const scrollLoop = () => {
        const scrollPos = container.scrollLeft;
        const totalWidth = track.scrollWidth;
        const oneSetWidth = totalWidth / 3;

        if (scrollPos >= oneSetWidth * 2) {
            container.scrollLeft = scrollPos - oneSetWidth;
        } else if (scrollPos <= 50) {
            container.scrollLeft = scrollPos + oneSetWidth;
        }
    };

    // 4. EFECTO VISUAL (Escala y Opacidad)
    const updateVisuals = () => {
        // En móvil, deshabilitar cálculos costosos de escala
        if (window.innerWidth < 768) return;

        const centerPoint = container.scrollLeft + (container.offsetWidth / 2);

        cardsNow.forEach(card => {
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
            const distance = Math.abs(centerPoint - cardCenter);
            const maxDistance = 500;

            if (distance < maxDistance) {
                const intensity = 1 - (distance / maxDistance);
                const opacity = 0.3 + (0.7 * intensity);
                const scale = 0.85 + (0.15 * intensity);

                card.style.opacity = opacity;
                card.style.transform = `scale(${scale})`;
            } else {
                card.style.opacity = 0.3;
                card.style.transform = 'scale(0.85)';
            }
        });
    };

    let isScrolling = false;

    container.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                scrollLoop();
                updateVisuals();
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    updateVisuals();

    // 5. BOTONES DE NAVEGACIÓN
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (prevBtn && nextBtn) {
        const scrollAmount = cardsNow[0].offsetWidth + 32;

        prevBtn.addEventListener('click', () => {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }
});

// Booking Selection System
document.addEventListener('DOMContentLoaded', () => {
    let selectedPackage = null;
    let selectedTimeSlot = null;

    const packages = {
        'express': { name: 'Paseo Express', price: '$30' },
        'workshop': { name: 'Workshop Urbano', price: '$50' },
        'privado': { name: 'Tour Privado', price: '$120' }
    };

    const pricingCards = document.querySelectorAll('.pricing-card');
    const pricingContainer = document.querySelector('#precios .grid');
    const whatsappBtn = document.getElementById('whatsappBookingBtn');

    // Hover effect - persists on last hovered card
    let lastHoveredCard = pricingCards[1]; // Workshop Urbano as initial default

    // Set initial highlight on Workshop (border + button orange)
    lastHoveredCard.classList.add('pricing-card-highlighted');
    const initialBtn = lastHoveredCard.querySelector('a[href="#agenda"]');
    if (initialBtn) {
        initialBtn.className = 'block w-full py-3 bg-amber-500 text-black text-center rounded-lg hover:bg-amber-400 transition-colors font-bold';
    }

    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('pricing-card-selected')) {
                pricingCards.forEach(c => {
                    if (!c.classList.contains('pricing-card-selected')) {
                        c.classList.remove('pricing-card-highlighted');
                        // Reset button to gray
                        const btn = c.querySelector('a[href="#agenda"]');
                        if (btn) {
                            btn.className = 'block w-full py-3 border border-white text-center rounded-lg hover:bg-white hover:text-black transition-colors font-bold';
                        }
                    }
                });
                card.classList.add('pricing-card-highlighted');
                lastHoveredCard = card; // Track last hovered

                // Change button to orange on hover
                const hoveredBtn = card.querySelector('a[href="#agenda"]');
                if (hoveredBtn) {
                    hoveredBtn.className = 'block w-full py-3 bg-amber-500 text-black text-center rounded-lg hover:bg-amber-400 transition-colors font-bold';
                }
            }
        });
    });

    if (pricingContainer) {
        pricingContainer.addEventListener('mouseleave', () => {
            pricingCards.forEach(c => {
                if (!c.classList.contains('pricing-card-selected')) {
                    c.classList.remove('pricing-card-highlighted');
                    // Reset all buttons to gray
                    const btn = c.querySelector('a[href="#agenda"]');
                    if (btn) {
                        btn.className = 'block w-full py-3 border border-white text-center rounded-lg hover:bg-white hover:text-black transition-colors font-bold';
                    }
                }
            });
            // Keep highlight on last hovered card if not selected
            if (!lastHoveredCard.classList.contains('pricing-card-selected')) {
                lastHoveredCard.classList.add('pricing-card-highlighted');
                // Keep button orange on last hovered
                const lastBtn = lastHoveredCard.querySelector('a[href="#agenda"]');
                if (lastBtn) {
                    lastBtn.className = 'block w-full py-3 bg-amber-500 text-black text-center rounded-lg hover:bg-amber-400 transition-colors font-bold';
                }
            }
        });
    }

    // Package selection
    pricingCards.forEach(card => {
        card.addEventListener('click', () => {
            const packageId = card.getAttribute('data-package-id');

            // Remove previous selection and restore original button styles
            pricingCards.forEach(c => {
                c.classList.remove('pricing-card-selected');
                const btn = c.querySelector('a[href="#agenda"]');
                if (btn) {
                    // Restore to original style
                    if (c.getAttribute('data-package-id') === 'workshop') {
                        btn.className = 'block w-full py-3 bg-amber-500 text-black text-center rounded-lg hover:bg-amber-400 transition-colors font-bold';
                    } else {
                        btn.className = 'block w-full py-3 border border-white text-center rounded-lg hover:bg-white hover:text-black transition-colors font-bold';
                    }
                }
            });

            // Add selection to clicked card
            card.classList.add('pricing-card-selected');
            card.classList.remove('pricing-card-highlighted');

            // Change button to orange for selected card
            const selectedBtn = card.querySelector('a[href="#agenda"]');
            if (selectedBtn) {
                selectedBtn.className = 'block w-full py-3 bg-amber-500 text-black text-center rounded-lg hover:bg-amber-400 transition-colors font-bold';
            }

            // Store selection
            selectedPackage = packages[packageId];

            // Update WhatsApp button
            updateWhatsAppButton();
        });
    });

    function updateWhatsAppButton() {
        const lang = currentLang || 'pt';
        const trans = window.translations[lang];
        let message = trans.whatsapp_booking_prefix;

        if (selectedPackage) {
            message += ` ${trans.whatsapp_package} *${selectedPackage.name}* (${selectedPackage.price})`;
        }

        if (selectedTimeSlot) {
            message += ` ${trans.whatsapp_for} *${selectedTimeSlot.dayName} ${selectedTimeSlot.date}* ${trans.whatsapp_at} *${selectedTimeSlot.hour}:00*`;
        }

        if (!whatsappBtn) return;
        whatsappBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    // Expose functions for time slot selection
    window.bookingSelection = {
        selectTimeSlot: (dayName, date, hour, slotElement) => {
            // Remove previous slot selection
            document.querySelectorAll('.time-slot-selected').forEach(el => {
                el.classList.remove('time-slot-selected');
            });

            // Add selection to clicked slot
            slotElement.classList.add('time-slot-selected');

            // Store selection
            selectedTimeSlot = { dayName, date, hour };

            // Update WhatsApp button
            updateWhatsAppButton();

            // Scroll to WhatsApp button with smooth animation
            const whatsappBtn = document.getElementById('whatsappBookingBtn');
            if (whatsappBtn) {
                whatsappBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add attention-grabbing pulse animation
                whatsappBtn.style.animation = 'pulse 1s ease-in-out 2';
            }
        }
    };
});

// Reveal on Scroll Animation
document.addEventListener('DOMContentLoaded', () => {
    // Parallax Logic for Hero
    const heroBg = document.getElementById('hero-bg');
    const heroSection = document.getElementById('inicio');

    if (heroBg && heroSection) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const heroHeight = heroSection.offsetHeight;

                    // Solo animar si el hero es visible (o cerca)
                    if (scrollY <= heroHeight) {
                        heroBg.style.transform = `translateY(${scrollY * 0.5}px)`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    const reveals = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - 100) reveal.classList.add('active');
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
});

// Weekly Time-Slot Calendar
document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = CONFIG.GOOGLE_API_KEY;
    const CALENDAR_ID = CONFIG.CALENDAR_ID;

    let currentWeekStart = getWeekStart(new Date());
    let busySlots = new Set();

    function getDayNamesShort() {
        const lang = currentLang || 'pt';
        return [
            window.translations[lang].day_sun,
            window.translations[lang].day_mon,
            window.translations[lang].day_tue,
            window.translations[lang].day_wed,
            window.translations[lang].day_thu,
            window.translations[lang].day_fri,
            window.translations[lang].day_sat
        ];
    }

    function getMonthNames() {
        const lang = currentLang || 'pt';
        return [
            window.translations[lang].month_jan,
            window.translations[lang].month_feb,
            window.translations[lang].month_mar,
            window.translations[lang].month_apr,
            window.translations[lang].month_may,
            window.translations[lang].month_jun,
            window.translations[lang].month_jul,
            window.translations[lang].month_aug,
            window.translations[lang].month_sep,
            window.translations[lang].month_oct,
            window.translations[lang].month_nov,
            window.translations[lang].month_dec
        ];
    }

    const START_HOUR = 9;
    const END_HOUR = 19;

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    function formatDate(date) {
        const monthNames = getMonthNames();
        return `${date.getDate()} ${monthNames[date.getMonth()]}`;
    }

    function updateWeekHeader() {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        document.getElementById('weekRange').textContent =
            `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)} ${currentWeekStart.getFullYear()}`;

        const dayNamesShort = getDayNamesShort();
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            document.getElementById(`day${i}`).innerHTML = `
                <div class="${isToday ? 'text-amber-400 font-bold' : ''}">${dayNamesShort[i]}</div>
                <div class="text-xs ${isToday ? 'text-amber-400' : 'text-gray-400'}">${dayDate.getDate()}</div>
            `;
        }
    }

    // Expose functions globally for language switching
    window.updateWeekHeader = updateWeekHeader;

    function getWeekEvents() {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const timeMin = currentWeekStart.toISOString();
        const timeMax = weekEnd.toISOString();

        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;

        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar el calendario. Verifica que esté público.');
                }
                return response.json();
            })
            .then(data => {
                busySlots.clear();
                if (data.items) {
                    data.items.forEach(event => {
                        const start = new Date(event.start.dateTime || event.start.date);
                        const end = new Date(event.end.dateTime || event.end.date);

                        let current = new Date(start);
                        while (current < end) {
                            const slotKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}-${current.getHours()}`;
                            busySlots.add(slotKey);
                            current.setHours(current.getHours() + 1);
                        }
                    });
                }
            })
            .catch(error => {
                document.getElementById('calendarError').classList.remove('hidden');
                document.getElementById('calendarError').querySelector('p').textContent = error.message;
            });
    }

    let currentMobileDayOffset = 0; // Track current day pair in mobile view

    function renderTimeSlots() {
        const grid = document.getElementById('timeSlotGrid');
        grid.innerHTML = '';

        const isMobile = window.innerWidth < 768;
        const numDaysToShow = isMobile ? 2 : 7;
        const startDayIndex = isMobile ? currentMobileDayOffset : 0;

        const lang = currentLang || 'pt';
        const dayNamesShort = getDayNamesShort();
        const busyText = window.translations[lang].calendar_slot_busy;
        const freeText = window.translations[lang].calendar_slot_free;

        for (let hour = START_HOUR; hour < END_HOUR; hour++) {
            const row = document.createElement('div');
            row.className = isMobile ? 'grid grid-cols-3 gap-1' : 'grid grid-cols-8 gap-1';

            const timeLabel = document.createElement('div');
            timeLabel.className = 'text-xs text-gray-500 py-3 pr-2 text-right';
            timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
            row.appendChild(timeLabel);

            for (let i = 0; i < numDaysToShow; i++) {
                const day = startDayIndex + i;
                if (day >= 7) break;

                const slotDate = new Date(currentWeekStart);
                slotDate.setDate(slotDate.getDate() + day);
                slotDate.setHours(hour, 0, 0, 0);

                const slotKey = `${slotDate.getFullYear()}-${slotDate.getMonth()}-${slotDate.getDate()}-${hour}`;
                const isBusy = busySlots.has(slotKey);
                const isPast = slotDate < new Date();

                const slot = document.createElement('div');
                slot.className = `py-3 px-2 rounded text-center text-xs transition-all ${isPast
                    ? 'bg-neutral-900/50 text-gray-600 cursor-not-allowed'
                    : isBusy
                        ? 'bg-red-500/20 border border-red-500/50 text-red-400 font-semibold cursor-not-allowed'
                        : 'bg-neutral-700/30 text-gray-400 hover:bg-neutral-600/50 hover:text-white cursor-pointer'
                    }`;

                if (isBusy) {
                    slot.textContent = busyText;
                    // Occupied slots show alert but are not selectable for booking
                    slot.addEventListener('click', () => {
                        alert(`🔴 Turno Agendado\n${dayNamesShort[day]} ${slotDate.getDate()} - ${hour}:00`);
                    });
                } else if (!isPast) {
                    slot.textContent = freeText;
                    // Free slots are selectable for booking
                    slot.addEventListener('click', () => {
                        if (window.bookingSelection) {
                            window.bookingSelection.selectTimeSlot(
                                dayNamesShort[day],
                                slotDate.getDate(),
                                hour,
                                slot
                            );
                        }
                    });
                }

                row.appendChild(slot);
            }

            grid.appendChild(row);
        }

        if (isMobile) {
            updateMobileDayIndicator();
        }
    }

    // Expose for language switching
    window.renderTimeSlots = renderTimeSlots;

    function updateMobileDayIndicator() {
        const indicator = document.getElementById('mobileDayIndicator');
        if (!indicator) return;

        const startDay = currentMobileDayOffset;
        const endDay = Math.min(currentMobileDayOffset + 1, 6);

        const startDate = new Date(currentWeekStart);
        startDate.setDate(startDate.getDate() + startDay);

        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + endDay);

        const dayNamesShort = getDayNamesShort();
        indicator.textContent = `${dayNamesShort[startDay]} ${startDate.getDate()} - ${dayNamesShort[endDay]} ${endDate.getDate()}`;
    }

    function changeMobileDay(delta) {
        currentMobileDayOffset += delta;

        // Si se pasa del sábado (día 6), avanza a la siguiente semana
        if (currentMobileDayOffset > 5) {
            changeWeek(1);
            currentMobileDayOffset = 0; // Resetear al domingo de la nueva semana
            return;
        }

        // Si retrocede antes del domingo (día 0), va a la semana anterior
        if (currentMobileDayOffset < 0) {
            changeWeek(-1);
            currentMobileDayOffset = 5; // Ir al viernes-sábado de la semana anterior
            return;
        }

        renderTimeSlots();
    }

    function changeWeek(delta) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (delta * 7));
        updateWeekHeader();
        loadCalendar();
    }

    function updateLastUpdateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const lang = currentLang || 'pt';
        const lastUpdateText = window.translations[lang].calendar_last_update;
        document.getElementById('lastUpdate').textContent = `${lastUpdateText} ${hours}:${minutes}:${seconds}`;
    }

    function loadCalendar(showLoading = true) {
        if (showLoading) {
            document.getElementById('calendarLoading').classList.remove('hidden');
        }
        document.getElementById('calendarError').classList.add('hidden');

        getWeekEvents()
            .then(() => {
                renderTimeSlots();
                updateLastUpdateTime();
            })
            .finally(() => {
                if (showLoading) {
                    document.getElementById('calendarLoading').classList.add('hidden');
                }
                document.getElementById('refreshIcon').classList.remove('animate-spin');
            });
    }

    const AUTO_REFRESH_INTERVAL = 60000;
    let refreshInterval;

    function startAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        refreshInterval = setInterval(() => {
            loadCalendar(false);
        }, AUTO_REFRESH_INTERVAL);
    }

    document.getElementById('manualRefresh').addEventListener('click', () => {
        document.getElementById('refreshIcon').classList.add('animate-spin');
        loadCalendar(true);
        startAutoRefresh();
    });

    document.getElementById('prevWeek').addEventListener('click', () => changeWeek(-1));
    document.getElementById('nextWeek').addEventListener('click', () => changeWeek(1));

    // Mobile day navigation
    const prevDayBtn = document.getElementById('prevDay');
    const nextDayBtn = document.getElementById('nextDay');

    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => changeMobileDay(-1));
    }
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => changeMobileDay(1));
    }

    // Re-render on window resize
    window.addEventListener('resize', () => {
        renderTimeSlots();
    });

    updateWeekHeader();
    loadCalendar();
    startAutoRefresh();
});

// Contact Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const scriptURL = 'https://script.google.com/u/0/home/projects/1BLHQi5k3Z6m5KJqzvR_VQP8Fc4XwPIxS56tDT9OM-jCnLb8piw0rPCDz/edit';
    const form = document.forms['contact-form'];
    const btn = document.getElementById('submit-btn');

    if (!form || !btn) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        btn.disabled = true;
        btn.innerText = "Enviando...";

        fetch(scriptURL, { method: 'POST', body: new FormData(form) })
            .then(response => {
                alert("¡Mensaje enviado! Revisa tu correo.");
                btn.innerText = "Enviado";
                form.reset();
            })
            .catch(error => {
                console.error('Error!', error.message);
                btn.disabled = false;
                btn.innerText = "Error, intenta de nuevo";
            });
    });
});
