// Global Constants
const MOBILE_BREAK = 768;

// Globals
var user;
var touchStartY;
var touchEndY;
var loading;
var scrollTimeout;
var s_Favorites;
var s_Hidden;
var s_Muted;
var s_ShowControls;

// Global Elements
var mainEl = document.getElementById("main");
var userLinkEl = document.getElementById("user-url");
var userStatusEl = document.querySelector(".username-status");
var videoMainEl = document.querySelector(".video-main");
var controlsEl = document.getElementById("controls");
var infoEl = document.querySelector(".video-info");

// Buttons
var muteButtonEl = document.querySelector(".mute-icon a");
var toggleControlsButtonEl = document.querySelector(".toggleControls-icon a");
var stopButtonEl = document.querySelector(".stop-icon");
var exitfsButtonEl = document.querySelector(".exitfs-icon");
var infoButtonEl = document.querySelector(".info-icon");

// Local Storage getters and setters
function getFavorites() {
   let favorites = JSON.parse(window.localStorage.getItem("favorites"));
   return favorites;
}

function getHidden() {
   let hidden = JSON.parse(window.localStorage.getItem("hidden"));
   return hidden;
}

function getMuted() {
   let muted = JSON.parse(window.localStorage.getItem("muted"));
   return muted;
}

function setMuted(m) {
   window.localStorage.setItem("muted", JSON.stringify(m));
   if (getMuted() !== null) return true;
   else return false;
}

function getShowInfo() {
   let showInfo = JSON.parse(window.localStorage.getItem("showInfo"));
   return showInfo;
}

function setShowInfo(showInfo) {
   window.localStorage.setItem("showInfo", JSON.stringify(showInfo));
   if (getShowInfo() !== null) return true;
   else return false;
}

function getShowControls() {
   let showControls = JSON.parse(window.localStorage.getItem("showControls"));
   return showControls;
}

function setShowControls(showControls) {
   window.localStorage.setItem("showControls", JSON.stringify(showControls));
   if (getShowControls() !== null) return true;
   else return false;
}

// Loop through each video element in videoMainEl
function forEachVideo(f, options = { direction: "forward" }) {
   if (options.direction === "reverse") {
      for (let index = videoMainEl.childElementCount - 1; index >= 0; index--) {
         f(videoMainEl.children[index], index);
      }
   } else {
      for (let index = 0; index < videoMainEl.childElementCount; index++) {
         f(videoMainEl.children[index], index);
      }
   }
}

function stopAllVideos() {
   forEachVideo((video) => {
      if (video.paused === false) {
         video.pause();
         video.currentTime = 0;
      }
   });
   stopButtonEl.classList.add("hidden");
}

function toggleMute() {
   forEachVideo((video) => {
      if (muteButtonEl.textContent === "volume_up") {
         video.muted = true;
         video.defaultMuted = true;
      } else if (muteButtonEl.textContent === "volume_off") {
         video.muted = false;
         video.defaultMuted = false;
      }
   });

   if (muteButtonEl.textContent === "volume_up") {
      muteButtonEl.textContent = "volume_off";
      setMuted(true);
   } else {
      muteButtonEl.textContent = "volume_up";
      setMuted(false);
   }
}

function isFullscreen() {
   if (videoMainEl.classList.contains("mobile-full")) return true;
   else return false;
}

function enterFullscreen() {
   if (videoMainEl.classList.contains("mobile-full") === false) {
      videoMainEl.classList.add("mobile-full");
      if (isFullscreen()) {
         if (getShowInfo()) showInfo();
         infoButtonEl.classList.remove("hidden");
         exitfsButtonEl.classList.remove("hidden");
      }
   } else return;
}

function exitFullscreen() {
   if (videoMainEl.classList.contains("mobile-full") === true) {
      videoMainEl.classList.remove("mobile-full");
      if (isFullscreen() === false) {
         stopAllVideos();
         hideInfo();
         infoButtonEl.classList.add("hidden");
         exitfsButtonEl.classList.add("hidden");
      }
   } else return;
}

function toggleFullscreen() {
   if (!isFullscreen()) {
      enterFullscreen();
   } else {
      exitFullscreen();
   }
}

function toggleHidden(videoEl, id) {
   let hidden = getHidden();

   if (videoEl) {
      if (hidden.filter((hidden) => hidden.id == id))
         videoEl.classList.toggle("hidden");
      return;
   } else {
      let videos = document.getElementsByClassName("video-post");
      for (let i = 0; i < videos.length; i++) {
         hidden
            .filter((hidden) => hidden.id == videos[i].getAttribute("data-id"))
            .forEach(() => videos[i].classList.toggle("hidden"));
      }
   }
}

function createLoader() {
   let loader = document.createElement("h3");
   loader.innerText = "Loading...";
   return loader;
}

function createVideoElement(videoObject) {
   return new Promise((resolve) => {
      // Set URI strings
      videoFileURL = `/user/${username}/video/${videoObject.id}.mp4`;
      thumbnailURL = `/user/${username}/video/${videoObject.id}.webp`;
      // Create <video> element
      // Set class names
      let videoEl = document.createElement("video");
      videoEl.className = "video-post";

      // Check favorites and hidden, add classes
      // toggleHidden(videoEl, videoObject.id);
      let muted = getMuted();
      let favorites = getFavorites();
      if (favorites && favorites.filter((fave) => fave.id === videoObject.id)) {
         videoEl.classList.add("favorite");
      }

      videoEl.setAttribute("preload", "metadata");
      videoEl.setAttribute("poster", thumbnailURL);
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("x5-playsinline", "true");
      videoEl.setAttribute("webkit-playsinline", "true");
      videoEl.setAttribute("tabindex", "2");
      videoEl.setAttribute("loop", "");
      videoEl.setAttribute("mediatype", "video");
      videoEl.setAttribute(
         "style",
         `background-image: url(${thumbnailURL})\
            ; background-repeat: no-repeat\
            ; background-position: center\
            ; background-size: contain`
      );
      videoEl.setAttribute("data-id", videoObject.id);
      videoEl.setAttribute("src", videoFileURL);
      if (muted) {
         videoEl.muted = true;
         videoEl.defaultMuted = true;
      } else {
         videoEl.muted = false;
         videoEl.defaultMuted = false;
      }
      videoMainEl.appendChild(videoEl);

      setTimeout(resolve, 0.01);
   });
}

async function createVideos(user) {
   try {
      let loader = createLoader();
      userStatusEl.appendChild(loader);

      videoMainEl.classList.add("loading");

      for (let i = 0; i < user.videos.length; i++) {
         await createVideoElement(user.videos[i]);
         loader.innerText = `Loading (${Math.floor(
            (videoMainEl.childElementCount / user.videos.length) * 100
         )}%)`;
      }

      loader.remove();
      videoMainEl.classList.remove("loading");
   } catch {
      console.error("Failed to load video.");
   }
}

function togglePlay(video, forcePlay = false) {
   if (video.paused || forcePlay === true) {
      // Pause playing videos if fullscreen
      if (isFullscreen()) {
         forEachVideo((v) => {
            if (v.paused === false) v.pause();
         });
      }
      video.play();
      if (isFullscreen === true) stopButtonEl.classList.remove("hidden");
   } else {
      video.pause();
      if (isFullscreen === true) stopButtonEl.classList.add("hidden");
   }
}

function getVideoTopDistance(video) {
   let videoTopDistance = Math.abs(
      video.offsetTop - videoMainEl.offsetTop - videoMainEl.scrollTop
   );
   return videoTopDistance;
}

// Get the index of the video closest to the top of the viewport
function getNearestVideoIndex(options = { direction: "forward" }) {
   var nearestVideoIndex;

   var allVideos = [...videoMainEl.children];

   if (options.direction === "reverse") allVideos.reverse();

   allVideos.sort((a, b) => {
      if (getVideoTopDistance(a) < getVideoTopDistance(b)) {
         return -1;
      }
      if (getVideoTopDistance(a) > getVideoTopDistance(b)) {
         return 1;
      } else {
         return 0;
      }
   });

   nearestVideoIndex = [...videoMainEl.children].indexOf(allVideos[0]);

   return nearestVideoIndex;
}

function getNearestVideo(offset = 0, options = { direction: "forward" }) {
   return videoMainEl.children[
      `${getNearestVideoIndex({ direction: options.direction }) + offset}`
   ];
}

function scrollVideo(videoEl, behavior, block) {
   videoEl.scrollIntoView({
      behavior: behavior || "smooth",
      block: block || "start"
   });
}

function isMobile() {
   if (window.innerWidth < MOBILE_BREAK) return true;
   else return false;
}

function mobileScroll(videos, scrollStart, scrollStop) {
   let nearestVideo = getNearestVideo(videos);

   if (!isMobile()) {
      return;
   }

   if (scrollStart && scrollStop) {
      let scrollDiff = scrollStop - scrollStart;

      if (scrollDiff === 0) return;
      else if (scrollDiff > 0) {
         nearestVideo = nearestVideo.nextElementSibling;
      } else if (scrollDiff < 0) {
         nearestVideo = nearestVideo.previousElementSibling;
      }

      scrollVideo(nearestVideo);
      if (nearestVideo.paused) setTimeout(() => togglePlay(nearestVideo), 100);
   }
}

function writeInfo() {
   const videoIndex = getNearestVideoIndex();
   const videoData = user.videos[videoIndex];

   const titleEl = document.querySelector(".video-info .info-title");
   const uploadDateEl = document.querySelector(".video-info .info-upload-date");
   const downloadDateEl = document.querySelector(
      ".video-info .info-download-date"
   );
   const descriptionEl = document.querySelector(
      ".video-info .info-description"
   );
   const viewsEl = document.querySelector(".video-info .info-views");
   const likesEl = document.querySelector(".video-info .info-likes");
   const commentsEl = document.querySelector(".video-info .info-comments");

   // Upload Date
   uploadDateEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">cloud_upload</span>`;

   if (videoData?.timestamp === undefined) {
      uploadDateEl.style.display = "none";
   } else {
      let uploadDate = new Date(videoData.timestamp * 1000);
      uploadDateEl.innerHTML += `<span> ${uploadDate.toDateString()}</span>`;
      uploadDateEl.style.display = "";
   }

   // Download Date
   downloadDateEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">download_for_offline</span>`;

   if (videoData?.epoch === undefined) {
      downloadDateEl.style.display = "none";
   } else {
      let downloadDate = new Date(videoData.epoch * 1000);
      downloadDateEl.innerHTML += `<span> ${downloadDate.toDateString()}</span>`;
      downloadDateEl.style.display = "";
   }

   // Description
   descriptionEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">description</span>`;

   if (videoData?.description === undefined || videoData?.description === "") {
      descriptionEl.style.display = "none";
   } else {
      descriptionEl.innerHTML += `<span> ${videoData.description}</span>`;
      descriptionEl.style.display = "";
   }

   // Title
   titleEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">title</span>`;

   if (
      videoData?.title === undefined ||
      videoData.title === videoData?.description ||
      videoData?.title === ""
   ) {
      titleEl.style.display = "none";
   } else {
      titleEl.innerHTML += `<span> ${videoData.title}</span>`;
      titleEl.style.display = "";
   }

   // Views
   viewsEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">play_arrow</span>`;

   if (videoData?.view_count === undefined) {
      viewsEl.style.display = "none";
   } else {
      viewsEl.innerHTML += `<span> ${videoData.view_count}</span>`;
      viewsEl.style.display = "";
   }

   // Likes
   likesEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">favorite</span>`;

   if (videoData?.like_count === undefined) {
      likesEl.style.display = "none";
   } else {
      likesEl.innerHTML += `<span> ${videoData.like_count}</span>`;
      likesEl.style.display = "";
   }

   // Comments
   commentsEl.innerHTML = `<span class="material-symbols-rounded video-info-icon">chat</span>`;

   if (videoData?.comment_count === undefined) {
      commentsEl.style.display = "none";
   } else {
      commentsEl.innerHTML += `<span> ${videoData.comment_count}</span>`;
      commentsEl.style.display = "";
   }
}

function showInfo() {
   infoEl.classList.remove("hidden");
   infoButtonEl.classList.remove("icon-nofill");
   writeInfo();
}

function hideInfo() {
   infoEl.classList.add("hidden");
   infoButtonEl.classList.add("icon-nofill");
}

function toggleInfo() {
   if (infoEl.classList.contains("hidden")) {
      showInfo();
      setShowInfo(true);
   } else {
      hideInfo();
      setShowInfo(false);
   }
}

function toggleControls(forceBool) {
   if (toggleControlsButtonEl.title === "Show Controls" || forceBool === true) {
      controlsEl.classList.remove("hidden");
      toggleControlsButtonEl.title = "Hide Controls";
      toggleControlsButtonEl.textContent = "expand_less";
   } else if (
      toggleControlsButtonEl.title === "Hide Controls" ||
      forceBool === false
   ) {
      controlsEl.classList.add("hidden");
      toggleControlsButtonEl.title = "Show Controls";
      toggleControlsButtonEl.textContent = "expand_more";
   }
}

function keyHandler(event) {
   event.preventDefault();

   const upKeys = ["k", "arrowup"];
   const downKeys = ["j", "arrowdown"];

   let nearestVideoIndex = getNearestVideoIndex();

   if (
      downKeys.includes(event.key.toLowerCase()) &&
      nearestVideoIndex !== videoMainEl.childElementCount - 1
   ) {
      let video;

      if (isFullscreen()) video = getNearestVideo(1);
      else video = getNearestVideo(1, { direction: "reverse" });

      scrollVideo(video);
   } else if (
      upKeys.includes(event.key.toLowerCase()) &&
      nearestVideoIndex > 0
   ) {
      scrollVideo(getNearestVideo(-1));
   } else if (event.key === " ") {
      let nearestVideo = getNearestVideo();

      if (isFullscreen()) {
         togglePlay(nearestVideo);
         return;
      }
   } else if (event.key === "Home") {
      scrollVideo(videoMainEl.firstElementChild);
   } else if (event.key === "End") {
      scrollVideo(videoMainEl.lastElementChild);
   } else if (event.key === "Escape") {
      if (isFullscreen()) exitFullscreen();
   } else if (event.key.toLowerCase() === "s") {
      stopAllVideos();
   } else if (event.key.toLowerCase() === "m") {
      toggleMute();
   } else return;
}

function controlsHandler(event) {
   event.preventDefault();
   switch (event.target.title) {
      case "Exit Fullscreen":
         exitFullscreen();
         break;
      case "Info":
         toggleInfo();
         break;
      case "Stop":
         stopAllVideos();
         break;
      case "Mute":
         toggleMute();
         break;
      case "Go To Top":
         scrollVideo(videoMainEl.firstElementChild);
         break;
      case "Go To Bottom":
         scrollVideo(videoMainEl.lastElementChild);
         break;
      default:
         return;
   }
}

function favoriteHandler(event) {
   event.preventDefault();
   nearestVideo = getNearestVideo(videoMainEl.children);
   id = nearestVideo.getAttribute("data-id");
   let video;

   for (let i = 0; i < user.videos.length; i++) {
      if (user.videos[i].id === id) {
         video = user.videos[i];
         break;
      }
   }

   if (video) {
      let favorites = getFavorites();

      if (!favorites) favorites = [];

      if (favorites.includes(video) === false) {
         favorites.push(video);
      } else if (favorites.includes(video)) {
         favorites = favorites.filter((fave) => fave != video);
      }

      window.localStorage.setItem("favorites", JSON.stringify(favorites));
   }
}

function hideHandler(event) {
   event.preventDefault();

   nearestVideo = getNearestVideo(videoMainEl.children);
   id = nearestVideo.getAttribute("data-id");
   let video;

   for (let i = 0; i < user.videos.length; i++) {
      if (user.videos[i].id === id) {
         video = user.videos[i];
         break;
      }
   }

   if (video) {
      let hidden = getHidden();

      if (!hidden) hidden = [];

      if (hidden.every((hidden) => hidden.id != id)) {
         hidden.push(video);
         nearestVideo.classList.add("hidden");
      }

      // Remove from hidden
      else if (hidden.filter((hidden) => hidden.id == id)) {
         hidden = hidden.filter((hidden) => hidden.id != id);
         nearestVideo.classList.remove("hidden");
      }

      window.localStorage.setItem("hidden", JSON.stringify(hidden));
   }
}

function clickHandler(event) {
   // Play/Pause
   if (event.target.tagName !== "VIDEO") return;

   if (!isFullscreen()) {
      enterFullscreen();
      scrollVideo(event.target, "auto");
      // Play is implicit with the scroll so we return
      return;
   }

   togglePlay(event.target);
}

function scrollHandler() {
   if (isFullscreen()) {
      if (scrollTimeout) {
         clearInterval(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
         writeInfo();
         togglePlay(getNearestVideo(), true);
      }, 100);
   } else return;
}

function touchHandler(event) {
   if (event.type === "touchstart") {
      touchStartY = videoMainEl.scrollTop;
   } else if (event.type === "touchend") {
      touchEndY = videoMainEl.scrollTop;
      mobileScroll(videoMainEl.children, touchStartY, touchEndY);
   }
}

function mouseoverHandler(event) {
   if (isFullscreen()) return;
   if (event.target.tagName !== "VIDEO") return;
   let video = event.target;
   video.muted = true;
   if (video.paused) togglePlay(video, true);
}

function mouseoutHandler(event) {
   if (isFullscreen()) return;
   if (event.target.tagName !== "VIDEO") return;
   let video = event.target;
   video.pause();
   video.currentTime = 0;
   video.muted = video.defaultMuted;
}

function toggleControlsHandler(event) {
   event.preventDefault();

   toggleControls();

   let showControls = !controlsEl.classList.contains("hidden");

   if (showControls === true) {
      setShowControls(true);
   } else if (showControls === false) {
      setShowControls(false);
   }
}

toggleControlsButtonEl.addEventListener("click", toggleControlsHandler);
controlsEl.addEventListener("click", controlsHandler);

videoMainEl.addEventListener("mouseout", mouseoutHandler);
videoMainEl.addEventListener("mouseover", mouseoverHandler);
videoMainEl.addEventListener("click", clickHandler);
videoMainEl.addEventListener("scroll", scrollHandler);
// videoMainEl.addEventListener("touchstart", touchHandler);
// videoMainEl.addEventListener("touchend", touchHandler);
// videoMainEl.addEventListener("mouseover", mouseoverHandler);

document.addEventListener("keydown", keyHandler);

// Ready
window.addEventListener("DOMContentLoaded", () => {
   userLinkEl.setAttribute("href", `https://tiktok.com/${username}`);
   document.querySelector(".username-heading").textContent = username;

   fetch(`./${username}/videos.json`)
      .then((res) => {
         if (res.ok) {
            return res.json();
         }
      })
      .then((data) => (user = data))
      .then(() => {
         user.videos.reverse();
         user.videos.forEach((videoObject) => {
            if (videoObject?.uploader_id) {
               user.id = videoObject.uploader_id;
               userLinkEl.setAttribute(
                  "href",
                  `https://tiktok.com/@${user.id}`
               );
               return;
            } else if (user?.id === undefined) {
               user.id = "";
            }
         });

         // Create Video Elements from user.videos array
         createVideos(user);
      })
      .catch((err) => {
         throw err;
      });

   s_Favorites = getFavorites();
   s_Hidden = getHidden();
   s_Muted = getMuted();
   s_ShowControls = getShowControls();

   if (s_ShowControls === null || s_ShowControls === true) {
      toggleControls(true);
   } else if (s_ShowControls === false) {
      toggleControls(false);
   }

   if (s_Muted) {
      muteButtonEl.textContent = "volume_off";
   } else {
      muteButtonEl.textContent = "volume_up";
   }
});

// Load videos after initial content is rendered
window.addEventListener("load", () => {});
