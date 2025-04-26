// Utility functions

// Example utility function to format timestamps
document.formatTimestamp = function(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}; 