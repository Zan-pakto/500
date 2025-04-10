// API Configuration
const FLIGHT_API_KEY = 'ab63ee9e14msh4cda285ee867cb7p163a33jsn5065afae71ea'; // Add your RapidAPI key here (same key works for both APIs)
const HOTEL_API_KEY = 'ab63ee9e14msh4cda285ee867cb7p163a33jsn5065afae71ea'; // Add your RapidAPI key here (same key works for both APIs)

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
            conversationState.currentStep = 'departureDate';
            addMessageToChat("When would you like to depart? (Please enter date in YYYY-MM-DD format)", 'bot');
            break;
        case 'departureDate':
            conversationState.collectedInfo.departureDate = message;
            conversationState.currentStep = 'returnDate';
            addMessageToChat("When would you like to return? (Please enter date in YYYY-MM-DD format)", 'bot');
            break;
        case 'returnDate':
            conversationState.collectedInfo.returnDate = message;
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
    // Updated Skyscanner API endpoint with proper error handling
    const url = `https://skyscanner50.p.rapidapi.com/api/v1/searchFlights?origin=${encodeURIComponent(data.from)}&destination=${encodeURIComponent(data.to)}&date=${data.departureDate}&returnDate=${data.returnDate}&adults=1&currency=USD&countryCode=US&market=en-US`;
    
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': FLIGHT_API_KEY,
            'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com'
        }
    };

    try {
        console.log('Searching flights with URL:', url);
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (!result.itineraries || result.itineraries.length === 0) {
            throw new Error('No flights found for the given criteria');
        }

        // Process and return flight data
        const flights = result.itineraries.map(itinerary => {
            const outboundLeg = itinerary.legs[0];
            const returnLeg = itinerary.legs[1];
            
            return {
                price: itinerary.price.raw,
                airline: outboundLeg.carriers[0].name,
                departureDate: outboundLeg.departure,
                returnDate: returnLeg.departure,
                from: data.from,
                to: data.to,
                duration: outboundLeg.duration,
                stops: outboundLeg.stops.length
            };
        });

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

    let message = "Here are the best flight deals I found:\n\n";
    flights.forEach(flight => {
        message += `✈️ ${flight.from} → ${flight.to}\n`;
        message += `💰 Price: $${flight.price}\n`;
        message += `📅 Departure: ${new Date(flight.departureDate).toLocaleDateString()}\n`;
        message += `📅 Return: ${new Date(flight.returnDate).toLocaleDateString()}\n`;
        message += `⏱️ Duration: ${flight.duration}\n`;
        message += `🛑 Stops: ${flight.stops}\n\n`;
    });
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