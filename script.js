// ========================================
// State Management
// ========================================
const state = {
    currentLanguage: localStorage.getItem('language') || 'en',
    participants: [],
    sharedCosts: [],
    participantIdCounter: 0,
    sharedCostIdCounter: 0
};

// ========================================
// Utility Functions
// ========================================
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    calculateParticipantTotal: (participant) => {
        return participant.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
};

// ========================================
// Theme and Language Management
// ========================================
const themeManager = {
    toggleDarkMode: () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
    },

    toggleLanguage: () => {
        state.currentLanguage = state.currentLanguage === 'id' ? 'en' : 'id';
        localStorage.setItem('language', state.currentLanguage);
        updateLanguage();
    }
};

// ========================================
// Participant Management
// ========================================
const participantManager = {
    add: () => {
        const participant = {
            id: state.participantIdCounter++,
            name: '',
            items: [{
                id: 0,
                name: '',
                price: 0,
                quantity: 1
            }]
        };
        state.participants.push(participant);
        renderParticipants();
    },

    remove: (id) => {
        state.participants = state.participants.filter(p => p.id !== id);
        renderParticipants();
        renderSharedCosts();
        calculateResults();
    },

    updateName: (id, name) => {
        const participant = state.participants.find(p => p.id === id);
        if (participant) {
            participant.name = name;
            renderSharedCosts();
            calculateResults();
        }
    },

    addItem: (participantId) => {
        const participant = state.participants.find(p => p.id === participantId);
        if (participant) {
            participant.items.push({
                id: participant.items.length,
                name: '',
                price: 0,
                quantity: 1
            });
            renderParticipants();
        }
    },

    removeItem: (participantId, itemId) => {
        const participant = state.participants.find(p => p.id === participantId);
        if (participant && participant.items.length > 1) {
            participant.items = participant.items.filter(item => item.id !== itemId);
            renderParticipants();
            calculateResults();
        }
    },

    updateItemName: (participantId, itemId, name) => {
        const participant = state.participants.find(p => p.id === participantId);
        if (participant) {
            const item = participant.items.find(i => i.id === itemId);
            if (item) {
                item.name = name;
            }
        }
    },

    updateItemPrice: (participantId, itemId, price) => {
        const participant = state.participants.find(p => p.id === participantId);
        if (participant) {
            const item = participant.items.find(i => i.id === itemId);
            if (item) {
                item.price = parseFloat(price) || 0;
                const participantDiv = document.querySelector(`#participantsList > div:nth-child(${state.participants.indexOf(participant) + 1})`);
                if (participantDiv) {
                    const totalSpan = participantDiv.querySelector('span.font-semibold');
                    if (totalSpan) {
                        const total = utils.calculateParticipantTotal(participant);
                        totalSpan.textContent = `Total: ${utils.formatCurrency(total)}`;
                    }
                }
                calculateResults();
            }
        }
    },

    updateQuantity: (participantId, itemId, change) => {
        const participant = state.participants.find(p => p.id === participantId);
        if (participant) {
            const item = participant.items.find(i => i.id === itemId);
            if (item) {
                item.quantity = Math.max(1, item.quantity + change);
                renderParticipants();
                calculateResults();
            }
        }
    }
};

// ========================================
// Shared Cost Management
// ========================================
const sharedCostManager = {
    add: () => {
        const sharedCost = {
            id: state.sharedCostIdCounter++,
            name: '',
            amount: 0,
            participants: []
        };
        state.sharedCosts.push(sharedCost);
        renderSharedCosts();
    },

    remove: (id) => {
        state.sharedCosts = state.sharedCosts.filter(c => c.id !== id);
        renderSharedCosts();
        calculateResults();
    },

    updateName: (id, name) => {
        const cost = state.sharedCosts.find(c => c.id === id);
        if (cost) {
            cost.name = name;
        }
    },

    updateAmount: (id, amount) => {
        const cost = state.sharedCosts.find(c => c.id === id);
        if (cost) {
            cost.amount = parseFloat(amount) || 0;
            calculateResults();
        }
    },

    toggleParticipant: (costId, participantId, checked) => {
        const cost = state.sharedCosts.find(c => c.id === costId);
        if (cost) {
            if (checked) {
                if (!cost.participants.includes(participantId)) {
                    cost.participants.push(participantId);
                }
            } else {
                cost.participants = cost.participants.filter(id => id !== participantId);
            }
            calculateResults();
        }
    }
};

// ========================================
// UI Update Functions
// ========================================
function updateLanguage() {
    document.getElementById('languageToggle').textContent = state.currentLanguage.toUpperCase();
    document.documentElement.lang = state.currentLanguage;
    
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[state.currentLanguage][key]) {
            element.textContent = translations[state.currentLanguage][key];
        }
    });
    
    renderParticipants();
    renderSharedCosts();
    calculateResults();
}

// ========================================
// Render Functions
// ========================================
function renderParticipants() {
    const container = document.getElementById('participantsList');
    container.innerHTML = '';
    
    if (state.participants.length === 0) {
        return;
    }
    
    state.participants.forEach(participant => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 slide-in';
        
        let itemsHtml = '';
        participant.items.forEach(item => {
            itemsHtml += `
                <div class="space-y-2 mb-3">
                    <div class="flex flex-col sm:flex-row gap-2">
                        <input type="text" placeholder="${translations[state.currentLanguage].itemName}" 
                               value="${item.name}"
                               oninput="participantManager.updateItemName(${participant.id}, ${item.id}, this.value)"
                               class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary">
                        <input type="number" placeholder="${translations[state.currentLanguage].itemPrice}" 
                               value="${item.price || ''}"
                               oninput="participantManager.updateItemPrice(${participant.id}, ${item.id}, this.value)"
                               class="w-full sm:w-32 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary">
                    </div>
                    <div class="flex items-center justify-between sm:justify-start gap-2">
                        <div class="flex items-center gap-2">
                            <button onclick="participantManager.updateQuantity(${participant.id}, ${item.id}, -1)" 
                                    class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center justify-center">
                                <i class="fas fa-minus text-xs"></i>
                            </button>
                            <span class="w-8 text-center text-sm">${item.quantity}</span>
                            <button onclick="participantManager.updateQuantity(${participant.id}, ${item.id}, 1)" 
                                    class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center justify-center">
                                <i class="fas fa-plus text-xs"></i>
                            </button>
                        </div>
                        ${participant.items.length > 1 ? `
                            <button onclick="participantManager.removeItem(${participant.id}, ${item.id})" 
                                    class="px-3 py-1 btn-danger flex items-center gap-1 text-sm">
                                <i class="fas fa-trash text-xs"></i>
                                <span class="sm:hidden">Hapus</span>
                            </button>
                        ` : '<div class="w-16"></div>'}
                    </div>
                </div>
            `;
        });
        
        const total = utils.calculateParticipantTotal(participant);
        
        participantDiv.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                <input type="text" placeholder="${translations[state.currentLanguage].participantName}" 
                       value="${participant.name}"
                       oninput="participantManager.updateName(${participant.id}, this.value)"
                       class="text-base sm:text-lg font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary">
                <button onclick="participantManager.remove(${participant.id})" 
                        class="sm:ml-2 px-4 py-2 btn-danger flex items-center justify-center sm:justify-start gap-2 text-sm font-medium">
                    <i class="fas fa-times"></i> 
                    <span>${translations[state.currentLanguage].removeParticipant}</span>
                </button>
            </div>
            ${itemsHtml}
            <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <button onclick="participantManager.addItem(${participant.id})" 
                        class="text-primary hover:text-indigo-700 text-sm font-medium">
                    <i class="fas fa-plus mr-1"></i> ${translations[state.currentLanguage].addItem}
                </button>
                <span class="font-semibold text-sm">Total: ${utils.formatCurrency(total)}</span>
            </div>
        `;
        
        container.appendChild(participantDiv);
    });
}

function renderSharedCosts() {
    const container = document.getElementById('sharedCostsList');
    container.innerHTML = '';
    
    state.sharedCosts.forEach(cost => {
        const costDiv = document.createElement('div');
        costDiv.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 slide-in';
        
        let participantsCheckboxes = '';
        state.participants.forEach(participant => {
            if (participant.name) {
                const isChecked = cost.participants.includes(participant.id);
                participantsCheckboxes += `
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" 
                               ${isChecked ? 'checked' : ''}
                               onchange="sharedCostManager.toggleParticipant(${cost.id}, ${participant.id}, this.checked)"
                               class="w-4 h-4 text-primary rounded focus:ring-primary">
                        <span>${participant.name || `${state.currentLanguage === 'id' ? 'Peserta' : 'Participant'} ${participant.id + 1}`}</span>
                    </label>
                `;
            }
        });
        
        costDiv.innerHTML = `
            <div class="flex flex-col gap-3">
                <div class="flex flex-col sm:flex-row gap-2">
                    <input type="text" placeholder="${translations[state.currentLanguage].costName}" 
                           value="${cost.name}"
                           oninput="sharedCostManager.updateName(${cost.id}, this.value)"
                           class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary">
                    <input type="number" placeholder="${translations[state.currentLanguage].costAmount}" 
                           value="${cost.amount || ''}"
                           oninput="sharedCostManager.updateAmount(${cost.id}, this.value)"
                           class="w-full sm:w-40 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary">
                </div>
                <button onclick="sharedCostManager.remove(${cost.id})" 
                        class="w-full sm:w-auto px-4 py-2 btn-danger flex items-center justify-center gap-2 text-sm font-medium">
                    <i class="fas fa-trash"></i> 
                    <span>${translations[state.currentLanguage].removeCost}</span>
                </button>
            </div>
            <div class="space-y-2 mt-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">${translations[state.currentLanguage].selectParticipants}:</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    ${participantsCheckboxes || `<p class="text-gray-500 dark:text-gray-400 text-sm">${translations[state.currentLanguage].noParticipants}</p>`}
                </div>
            </div>
        `;
        
        container.appendChild(costDiv);
    });
}

// ========================================
// Calculation Functions
// ========================================
function calculateResults() {
    const taxPercentage = parseFloat(document.getElementById('taxPercentage').value) || 0;
    const serviceAmount = parseFloat(document.getElementById('serviceAmount').value) || 0;
    const tbody = document.getElementById('resultsTableBody');
    const mobileView = document.getElementById('resultsMobileView');
    
    tbody.innerHTML = '';
    mobileView.innerHTML = '';
    
    let grandTotal = 0;
    const results = [];
    
    const totalPersonalCosts = state.participants.reduce((sum, p) => sum + utils.calculateParticipantTotal(p), 0);
    const servicePerParticipant = state.participants.length > 0 ? serviceAmount / state.participants.length : 0;
    
    state.participants.forEach(participant => {
        const personalCost = utils.calculateParticipantTotal(participant);
        
        let sharedCostTotal = 0;
        state.sharedCosts.forEach(cost => {
            if (cost.participants.includes(participant.id) && cost.participants.length > 0) {
                sharedCostTotal += cost.amount / cost.participants.length;
            }
        });
        
        const taxAmount = totalPersonalCosts > 0 ? (personalCost / totalPersonalCosts) * (totalPersonalCosts * taxPercentage / 100) : 0;
        const total = personalCost + sharedCostTotal + taxAmount + servicePerParticipant;
        
        grandTotal += total;
        
        results.push({
            name: participant.name || `${state.currentLanguage === 'id' ? 'Peserta' : 'Participant'} ${participant.id + 1}`,
            personalCost,
            sharedCost: sharedCostTotal,
            tax: taxAmount,
            service: servicePerParticipant,
            total
        });
    });
    
    // Render desktop table
    results.forEach(result => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium">${result.name}</td>
            <td class="px-4 py-3 text-right text-sm">${utils.formatCurrency(result.personalCost)}</td>
            <td class="px-4 py-3 text-right text-sm">${utils.formatCurrency(result.sharedCost)}</td>
            <td class="px-4 py-3 text-right text-sm">${utils.formatCurrency(result.tax)}</td>
            <td class="px-4 py-3 text-right text-sm">${utils.formatCurrency(result.service)}</td>
            <td class="px-4 py-3 text-right font-bold text-primary text-sm">${utils.formatCurrency(result.total)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add grand total row
    const grandTotalRow = document.createElement('tr');
    grandTotalRow.className = 'bg-gray-100 dark:bg-gray-700 font-bold';
    grandTotalRow.innerHTML = `
        <td colspan="5" class="px-4 py-3 text-right text-sm">${translations[state.currentLanguage].grandTotal}:</td>
        <td class="px-4 py-3 text-right text-primary text-lg">${utils.formatCurrency(grandTotal)}</td>
    `;
    tbody.appendChild(grandTotalRow);
    
    // Render mobile cards
    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        card.innerHTML = `
            <div class="result-card-header">
                <h4 class="font-semibold">${result.name}</h4>
                <span class="text-lg font-bold text-primary">${utils.formatCurrency(result.total)}</span>
            </div>
            <div class="result-card-body">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">${translations[state.currentLanguage].personalColumn}:</span>
                    <span>${utils.formatCurrency(result.personalCost)}</span>
                </div>
                ${result.sharedCost > 0 ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">${translations[state.currentLanguage].sharedColumn}:</span>
                        <span>${utils.formatCurrency(result.sharedCost)}</span>
                    </div>
                ` : ''}
                ${result.tax > 0 ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">${translations[state.currentLanguage].taxColumn}:</span>
                        <span>${utils.formatCurrency(result.tax)}</span>
                    </div>
                ` : ''}
                ${result.service > 0 ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">${translations[state.currentLanguage].serviceColumn}:</span>
                        <span>${utils.formatCurrency(result.service)}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        mobileView.appendChild(card);
    });
    
    // Add grand total card
    const grandTotalCard = document.createElement('div');
    grandTotalCard.className = 'bg-primary text-white rounded-lg p-4 text-center';
    grandTotalCard.innerHTML = `
        <div class="text-sm uppercase tracking-wider mb-1">${translations[state.currentLanguage].grandTotal}</div>
        <div class="text-2xl font-bold">${utils.formatCurrency(grandTotal)}</div>
    `;
    mobileView.appendChild(grandTotalCard);
}

// ========================================
// Share Functions
// ========================================
async function generateImage() {
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 400px; background: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;';
    document.body.appendChild(imageContainer);
    
    const taxPercentage = parseFloat(document.getElementById('taxPercentage').value) || 0;
    const serviceAmount = parseFloat(document.getElementById('serviceAmount').value) || 0;
    let grandTotal = 0;
    const results = [];
    
    const totalPersonalCosts = state.participants.reduce((sum, p) => sum + utils.calculateParticipantTotal(p), 0);
    const servicePerParticipant = state.participants.length > 0 ? serviceAmount / state.participants.length : 0;
    
    state.participants.forEach(participant => {
        const personalCost = utils.calculateParticipantTotal(participant);
        let sharedCostTotal = 0;
        state.sharedCosts.forEach(cost => {
            if (cost.participants.includes(participant.id) && cost.participants.length > 0) {
                sharedCostTotal += cost.amount / cost.participants.length;
            }
        });
        const taxAmount = totalPersonalCosts > 0 ? (personalCost / totalPersonalCosts) * (totalPersonalCosts * taxPercentage / 100) : 0;
        const total = personalCost + sharedCostTotal + taxAmount + servicePerParticipant;
        grandTotal += total;
        
        results.push({
            name: participant.name || `${state.currentLanguage === 'id' ? 'Peserta' : 'Participant'} ${participant.id + 1}`,
            personalCost,
            sharedCost: sharedCostTotal,
            tax: taxAmount,
            service: servicePerParticipant,
            total
        });
    });
    
    imageContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, #4338CA 0%, #7C3AED 100%); padding: 40px;">
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.15);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: -0.5px;">
                        💰 SplitBill
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">
                        ${translations[state.currentLanguage].resultsTitle}
                    </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <!-- Results -->
                    ${results.map((result, index) => {
                        const isEven = index % 2 === 0;
                        const bgColor = isEven ? '#F3F4F6' : '#FAFAFA';
                        const accentColor = isEven ? '#3B82F6' : '#8B5CF6';
                        
                        // Build details rows
                        const detailRows = [];
                        if (result.personalCost > 0) {
                            detailRows.push(`<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">${translations[state.currentLanguage].personalColumn}</td><td style="text-align: right; padding: 4px 0; color: #374151; font-size: 13px;">${utils.formatCurrency(result.personalCost)}</td></tr>`);
                        }
                        if (result.sharedCost > 0) {
                            detailRows.push(`<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">${translations[state.currentLanguage].sharedColumn}</td><td style="text-align: right; padding: 4px 0; color: #374151; font-size: 13px;">${utils.formatCurrency(result.sharedCost)}</td></tr>`);
                        }
                        if (result.tax > 0) {
                            detailRows.push(`<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">${translations[state.currentLanguage].taxColumn}</td><td style="text-align: right; padding: 4px 0; color: #374151; font-size: 13px;">${utils.formatCurrency(result.tax)}</td></tr>`);
                        }
                        if (result.service > 0) {
                            detailRows.push(`<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">${translations[state.currentLanguage].serviceColumn}</td><td style="text-align: right; padding: 4px 0; color: #374151; font-size: 13px;">${utils.formatCurrency(result.service)}</td></tr>`);
                        }
                        
                        return `
                        <div style="background: ${bgColor}; border-radius: 12px; padding: 20px; margin-bottom: 12px; border: 1px solid #E5E7EB;">
                            <!-- Name and total in single row -->
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <!-- Name -->
                                <div style="flex: 1;">
                                    <span style="font-size: 18px; font-weight: 600; color: #111827;">
                                        ${result.name}
                                    </span>
                                </div>
                                <!-- Total -->
                                <div>
                                    <span style="font-size: 22px; font-weight: bold; color: ${accentColor};">
                                        ${utils.formatCurrency(result.total)}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Details -->
                            ${detailRows.length > 0 ? `
                                <table style="width: 100%; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
                                    ${detailRows.join('')}
                                </table>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                    
                    <!-- Grand Total -->
                    <div style="background: linear-gradient(135deg, #1E293B 0%, #334155 100%); border-radius: 16px; padding: 25px; text-align: center; margin-top: 20px;">
                        <p style="color: #94A3B8; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px 0; font-weight: 600;">
                            ${translations[state.currentLanguage].grandTotal}
                        </p>
                        <p style="color: white; font-size: 36px; font-weight: 800; margin: 0;">
                            ${utils.formatCurrency(grandTotal)}
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                        <p style="font-size: 14px; color: #6B7280; margin: 0 0 8px 0;">
                            Made with <span style="color: #EF4444;">❤️</span> by Awwal
                        </p>
                        <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
                            ${new Date().toLocaleDateString(state.currentLanguage === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    try {
        const canvas = await html2canvas(imageContainer, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            width: 400,
            windowWidth: 400
        });
        
        document.body.removeChild(imageContainer);
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'splitbill-result.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'SplitBill Result',
                        text: 'Check out our bill split!'
                    });
                } catch (err) {
                    console.log('Share cancelled');
                }
            } else {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = 'splitbill-result.png';
                a.click();
            }
        });
    } catch (error) {
        console.error('Error generating image:', error);
        alert('Error generating image. Please try again.');
        if (document.body.contains(imageContainer)) {
            document.body.removeChild(imageContainer);
        }
    }
}

function shareWhatsApp() {
    let message = `*SplitBill - ${translations[state.currentLanguage].resultsTitle}*\n\n`;
    
    const tbody = document.getElementById('resultsTableBody');
    const rows = tbody.querySelectorAll('tr:not(:last-child)');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 6) {
            message += `*${cells[0].textContent}*\n`;
            message += `${translations[state.currentLanguage].personalColumn}: ${cells[1].textContent}\n`;
            message += `${translations[state.currentLanguage].sharedColumn}: ${cells[2].textContent}\n`;
            message += `${translations[state.currentLanguage].taxColumn}: ${cells[3].textContent}\n`;
            message += `${translations[state.currentLanguage].serviceColumn}: ${cells[4].textContent}\n`;
            message += `${translations[state.currentLanguage].totalColumn}: ${cells[5].textContent}\n\n`;
        }
    });
    
    const grandTotalRow = tbody.querySelector('tr:last-child');
    if (grandTotalRow) {
        const cells = grandTotalRow.querySelectorAll('td');
        message += `*${cells[0].textContent}* ${cells[1].textContent}\n`;
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ========================================
// Initialization
// ========================================
function init() {
    updateLanguage();
    
    if (localStorage.getItem('darkMode') === null || localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
    }
    
    // Event listeners
    document.getElementById('darkModeToggle').addEventListener('click', themeManager.toggleDarkMode);
    document.getElementById('languageToggle').addEventListener('click', themeManager.toggleLanguage);
    document.getElementById('addParticipant').addEventListener('click', participantManager.add);
    document.getElementById('addSharedCost').addEventListener('click', sharedCostManager.add);
    document.getElementById('taxPercentage').addEventListener('input', calculateResults);
    document.getElementById('serviceAmount').addEventListener('input', calculateResults);
    document.getElementById('generateImage').addEventListener('click', generateImage);
    document.getElementById('shareWhatsApp').addEventListener('click', shareWhatsApp);
    
    renderParticipants();
    renderSharedCosts();
    calculateResults();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);