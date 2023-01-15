secondsToMs = m => m * 1000;

module.exports = {
    /**
     * API polling interval.
     *  The amount of seconds before the next API call is made to check 
     *  your presence.
     */
    pollingInterval: secondsToMs(20), // 20 seconds per API check
    /**
     * Presence details
     *   0: Offline, Online
     *   1: Offline, Online, In-Game
     *   2: Offline, Online, In-Game, Studio
     * 
     * Note: Type 0 will completely ignore any game thumbnails settings
     * as it does not take into account your game status and will just
     * show "Online" instead, just as Type 2 will not show Studio status.
     */
    presenceDetails: 2,
    /**
     * Thumbnail states.
     *   false: Don't show thumbnails of this type.
     *   true:  Do show thumbnails of this type.
     * 
     * Example: having user thumbnails disabled and game thumbnails 
     * enabled will show only the game thumbnails when you are in game, 
     * and no thumbnails when not in a game.
     */
    showGameThumbnail: true, // Change to false to disable.
    showUserThumbnail: true, // Change to false to disable.
    /**
     * User thumbnail type.
     *   0: Headshot (Profile picture)
     *   1: Full-body
     * 
     * This will change the thumbnail image shown in the rich presence.
     */
    userThumbnailType: 1,
};