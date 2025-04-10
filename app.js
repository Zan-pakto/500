// API Configuration
const FLIGHT_API_KEY = 'ab63ee9e14msh4cda285ee867cb7p163a33jsn5065afae71ea'; // Add your RapidAPI key here (same key works for both APIs)
const HOTEL_API_KEY = 'ab63ee9e14msh4cda285ee867cb7p163a33jsn5065afae71ea'; // Add your RapidAPI key here (same key works for both APIs)
const AVIATION_API_KEY = '21523f4e74d1afebf7db88e0628b414b';

// City to IATA Code Mapping
const cityToIATA = {
    // India
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'bangalore': 'BLR',
    'chennai': 'MAA',
    'kolkata': 'CCU',
    'hyderabad': 'HYD',
    'ahmedabad': 'AMD',
    'pune': 'PNQ',
    'goa': 'GOI',
    
    // UK
    'london': 'LHR',
    'manchester': 'MAN',
    'birmingham': 'BHX',
    
    // USA
    'newyork': 'JFK',
    'chicago': 'ORD',
    'losangeles': 'LAX',
    'miami': 'MIA',
    'sanfrancisco': 'SFO',
    
    // Other major cities
    'dubai': 'DXB',
    'singapore': 'SIN',
    'bangkok': 'BKK',
    'paris': 'CDG',
    'frankfurt': 'FRA'
};

// Helper function to get IATA code
function getIATACode(city) {
    const normalizedCity = city.toLowerCase().replace(/\s+/g, '');
    return cityToIATA[normalizedCity] || city.toUpperCase();
}

// Note: You can use the same RapidAPI key for both services
// Get your API key from:
// 1. https://rapidapi.com/skyscanner/api/skyscanner-flight-search
// 2. https://rapidapi.com/tipsters/api/booking-com

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const searchFormContainer = document.getElementById('searchFormContainer');
const searchForm = document.getElementById('searchForm');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');

// Chat state
let conversationState = {
    collectingInfo: false,
    currentStep: null,
    collectedInfo: {}
};

// Event Listeners
sendButton.addEventListener('click', handleUserMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserMessage();
    }
});

// Chat Functions
function handleUserMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    userInput.value = '';

    // Process the message
    processUserMessage(message);
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processUserMessage(message) {
    const lowerMessage = message.toLowerCase();

    if (conversationState.collectingInfo) {
        handleInfoCollection(message);
        return;
    }

    if (lowerMessage.includes('flight') || lowerMessage.includes('fly')) {
        startFlightSearch();
    } else if (lowerMessage.includes('hotel') || lowerMessage.includes('stay')) {
        startHotelSearch();
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        showHelpMessage();
    } else {
        addMessageToChat("I'm not sure I understand. You can ask me about flights, hotels, or type 'help' to see what I can do.", 'bot');
    }
}

function startFlightSearch() {
    conversationState.collectingInfo = true;
    conversationState.currentStep = 'from';
    addMessageToChat("Great! Let's find you the best flight deals. Where will you be flying from?", 'bot');
}

function startHotelSearch() {
    conversationState.collectingInfo = true;
    conversationState.currentStep = 'location';
    addMessageToChat("I'll help you find the perfect hotel. Which city would you like to stay in?", 'bot');
}

function handleInfoCollection(message) {
    switch (conversationState.currentStep) {
        case 'from':
            conversationState.collectedInfo.from = message;
            conversationState.currentStep = 'to';
            addMessageToChat("Where would you like to fly to?", 'bot');
            break;
        case 'to':
            conversationState.collectedInfo.to = message;
            conversationState.currentStep = 'date';
            addMessageToChat("When would you like to travel? Please enter the date in YYYY-MM-DD format (e.g., 2024-04-15)", 'bot');
            break;
        case 'date':
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(message)) {
                addMessageToChat("Please enter the date in YYYY-MM-DD format (e.g., 2024-04-15)", 'bot');
                return;
            }
            const inputDate = new Date(message);
            const today = new Date();
            if (inputDate < today) {
                addMessageToChat("Please enter a future date.", 'bot');
                return;
            }
            conversationState.collectedInfo.date = message;
            completeFlightSearch();
            break;
        case 'location':
            conversationState.collectedInfo.hotelLocation = message;
            conversationState.currentStep = 'checkInDate';
            addMessageToChat("When would you like to check in? (Please enter date in YYYY-MM-DD format)", 'bot');
            break;
        case 'checkInDate':
            conversationState.collectedInfo.checkInDate = message;
            completeHotelSearch();
            break;
    }
}

function completeFlightSearch() {
    addMessageToChat("Searching for the best flight deals...", 'bot');
    showLoading();
    
    searchFlights(conversationState.collectedInfo)
        .then(flights => {
            hideLoading();
            displayFlightResults(flights);
            resetConversationState();
        })
        .catch(error => {
            hideLoading();
            addMessageToChat("I'm sorry, I couldn't find any flights. Please try again later.", 'bot');
            resetConversationState();
        });
}

function completeHotelSearch() {
    addMessageToChat("Searching for the best hotel deals...", 'bot');
    showLoading();
    
    searchHotels(conversationState.collectedInfo)
        .then(hotels => {
            hideLoading();
            displayHotelResults(hotels);
            resetConversationState();
        })
        .catch(error => {
            hideLoading();
            addMessageToChat("I'm sorry, I couldn't find any hotels. Please try again later.", 'bot');
            resetConversationState();
        });
}

function resetConversationState() {
    conversationState = {
        collectingInfo: false,
        currentStep: null,
        collectedInfo: {}
    };
}

function showHelpMessage() {
    addMessageToChat("I can help you with:", 'bot');
    addMessageToChat("- Finding the best flight deals\n- Searching for hotels\n- Planning your itinerary\n- Getting travel recommendations\n\nJust tell me what you're looking for!", 'bot');
}

// API Functions
async function searchFlights(data) {
    const fromCode = getIATACode(data.from);
    const toCode = getIATACode(data.to);
    
    // Using AviationStack API with date parameters
    const url = `https://api.aviationstack.com/v1/flights?access_key=${AVIATION_API_KEY}&dep_iata=${fromCode}&arr_iata=${toCode}&date=${data.date}`;
    
    try {
        console.log('Searching flights with URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (!result.data || result.data.length === 0) {
            throw new Error('No flights found for the given criteria');
        }

        // Process and return flight data
        const flights = result.data.map(flight => ({
            airline: flight.airline.name,
            flightNumber: flight.flight.iata,
            departureTime: flight.departure.scheduled,
            arrivalTime: flight.arrival.scheduled,
            status: flight.flight_status,
            from: flight.departure.airport,
            to: flight.arrival.airport,
            terminal: flight.departure.terminal || 'Not specified',
            gate: flight.departure.gate || 'Not specified',
            date: data.date
        }));

        return flights;
    } catch (error) {
        console.error('Flight search error:', error);
        throw new Error(`Failed to fetch flight data: ${error.message}`);
    }
}

async function searchHotels(data) {
    // Using Booking.com API as an example
    const url = `https://booking-com.p.rapidapi.com/v1/hotels/search?location=${data.hotelLocation}&checkin_date=${data.checkInDate}&adults_number=1`;
    
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': HOTEL_API_KEY,
            'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result.result.map(hotel => ({
            name: hotel.hotel_name,
            price: hotel.min_total_price,
            rating: hotel.review_score,
            location: hotel.address
        }));
    } catch (error) {
        throw new Error('Failed to fetch hotel data');
    }
}

// Display Functions
function displayFlightResults(flights) {
    if (flights.length === 0) {
        addMessageToChat("I couldn't find any flights matching your criteria. Would you like to try a different search?", 'bot');
        return;
    }

    // Take only top 5 flights
    const topFlights = flights.slice(0, 5);
    
    let message = "Here are the top 5 available flights:\n\n";
    message += "<div class='flight-cards-container'>";
    
    topFlights.forEach((flight, index) => {
        const departureTime = new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const arrivalTime = new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const flightDate = new Date(flight.departureTime).toLocaleDateString('en-IN', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        // Generate random price between ₹5000 and ₹50000
        const basePrice = Math.floor(Math.random() * 45000) + 5000;
        // Add some variation based on airline and route
        const airlineMultiplier = flight.airline.includes('Air India') ? 1.2 : 
                                flight.airline.includes('Emirates') ? 1.5 : 1.0;
        const routeMultiplier = flight.from === 'BOM' && flight.to === 'DEL' ? 0.8 : 1.0;
        const finalPrice = Math.round(basePrice * airlineMultiplier * routeMultiplier);
        
        message += `
            <div class='flight-card'>
                <div class='flight-header'>
                    <span class='flight-number'>Flight #${index + 1}</span>
                    <span class='flight-status ${flight.status.toLowerCase()}'>${flight.status}</span>
                </div>
                <div class='flight-airline'>
                    <span class='airline-icon'>✈️</span>
                    <span class='airline-name'>${flight.airline}</span>
                    <span class='flight-code'>(${flight.flightNumber})</span>
                </div>
                <div class='flight-date'>
                    <span class='date-icon'>📅</span>
                    <span class='date'>${flightDate}</span>
                </div>
                <div class='flight-route'>
                    <div class='route-details'>
                        <span class='from'>${flight.from}</span>
                        <span class='arrow'>→</span>
                        <span class='to'>${flight.to}</span>
                    </div>
                    <div class='time-details'>
                        <span class='departure-time'>${departureTime}</span>
                        <span class='arrival-time'>${arrivalTime}</span>
                    </div>
                </div>
                <div class='flight-price'>
                    <span class='price-icon'>💰</span>
                    <span class='price'>₹${finalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div class='flight-terminal'>
                    <span class='terminal'>Terminal: ${flight.terminal}</span>
                    <span class='gate'>Gate: ${flight.gate}</span>
                </div>
            </div>
        `;
    });
    
    message += "</div>";
    
    // Add CSS styles for the cards
    message += `
        <style>
            .flight-cards-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin: 20px 0;
            }
            .flight-card {
                background: #ffffff;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
            }
            .flight-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .flight-number {
                font-weight: bold;
                color: #333;
            }
            .flight-status {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.8em;
            }
            .flight-status.scheduled {
                background: #e3f2fd;
                color: #1976d2;
            }
            .flight-status.active {
                background: #e8f5e9;
                color: #2e7d32;
            }
            .flight-airline {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .airline-name {
                font-weight: bold;
                color: #333;
            }
            .flight-code {
                color: #666;
            }
            .flight-route {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
            }
            .route-details {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .from, .to {
                font-weight: bold;
                color: #333;
            }
            .arrow {
                color: #666;
            }
            .time-details {
                color: #666;
            }
            .flight-price {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 10px 0;
                font-weight: bold;
                color: #2e7d32;
            }
            .flight-terminal {
                display: flex;
                justify-content: space-between;
                color: #666;
                font-size: 0.9em;
            }
        </style>
    `;
    
    addMessageToChat(message, 'bot');
}

function displayHotelResults(hotels) {
    if (hotels.length === 0) {
        addMessageToChat("I couldn't find any hotels matching your criteria. Would you like to try a different search?", 'bot');
        return;
    }

    let message = "Here are the best hotel deals I found:\n\n";
    hotels.forEach(hotel => {
        message += `🏨 ${hotel.name}\n`;
        message += `📍 ${hotel.location}\n`;
        message += `💰 Price: $${hotel.price} per night\n`;
        message += `⭐ Rating: ${'★'.repeat(Math.round(hotel.rating))}\n\n`;
    });
    addMessageToChat(message, 'bot');
}

// Utility Functions
function showLoading() {
    loadingDiv.classList.remove('hidden');
}

function hideLoading() {
    loadingDiv.classList.add('hidden');
} 