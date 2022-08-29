// Globals
var user;
var touchStartY;
var touchEndY;
var videoCollection;
var s_Favorites;
var s_Hidden;
var s_Muted;

// Global Elements
var mainEl = document.getElementById("main");
var userLinkEl = document.getElementById("user-url");
var userStatusEl = document.querySelector(".username-status");
var videoMainEl = document.querySelector(".video-main");
var toTopEl = document.querySelector(".to-top-icon a");
var toBottomEl = document.querySelector(".to-bottom-icon a");
var stopEl = document.querySelector(".stop-icon a");
var muteEl = document.querySelector(".mute-icon a");
var faveEl = document.querySelector(".favorite-icon a");
var hideEl = document.querySelector(".hide-icon a");

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

function forEachVideo(f) {
   for (let i = 0; i < videoCollection.length; i++) {
      f(videoCollection[i]);
   }
}

function stopAllVideos() {
   forEachVideo((video) => {
      if (video.paused === false) {
         video.pause();
         video.currentTime = 0;
      }
   });
}

function toggleMute() {
   forEachVideo((video) => {
      if (muteEl.textContent === "volume_up") {
         video.muted = true;
         video.defaultMuted = true;
      } else if (muteEl.textContent === "volume_off") {
         video.muted = false;
         video.defaultMuted = false;
      }
   });

   if (muteEl.textContent === "volume_up") {
      muteEl.textContent = "volume_off";
      setMuted(true);
   } else {
      muteEl.textContent = "volume_up";
      setMuted(false);
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

      if (videoObject.description) videoEl.setAttribute("preload", "none");
      else videoEl.setAttribute("preload", "metadata");

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
      }
      videoMainEl.appendChild(videoEl);

      setTimeout(resolve, 0.01);
   });
}

async function createVideos(user) {
   try {
      let loader = createLoader();
      userStatusEl.appendChild(loader);

      for (let i = user.videos.length - 1; i >= 0; i--) {
         await createVideoElement(user.videos[i]);
         videoCollection = document.getElementsByClassName("video-post");
         loader.innerText = `Loading (${Math.floor(
            (videoCollection.length / user.videos.length) * 100
         )}%)`;
      }

      loader.remove();
   } catch {
      console.error("Failed to load video.");
   }
}

function togglePlay(video) {
   if (video.paused) {
      // Check if it's a favorite
      // if (favorites.filter((faveVideo) => faveVideo.id === video.id))
      //    faveEl.setAttribute("style", "color: red");
      // else faveEl.removeAttribute("style");

      // Pause playing videos if mobile
      if (isMobile(video)) {
         forEachVideo((v) => {
            if (v.paused === false) v.pause();
         });
      }

      // Load if not loaded before playing so we don't get a black flickering
      if (video.duration === NaN) video.load();
      video.play();
   } else video.pause();
}

// Get the index of the video closest to the top of the viewport
function getNearestVideoIndex(opts = { direction: "down" }) {
   var nearestVideoDistance = 10 ** 10;
   var nearestVideo;

   if (opts.direction === "up") {
      for (var i = videoCollection.length - 1; i >= 0; i--) {
         let videoTopDistance = getVideoTopDistance(videoCollection[i]);

         if (videoTopDistance < nearestVideoDistance) {
            nearestVideoDistance = videoTopDistance;
            nearestVideo = i;
         }
      }
   } else {
      forEachVideo((video) => {
         let videoTopDistance = getVideoTopDistance(video);
         if (videoTopDistance < nearestVideoDistance) {
            nearestVideoDistance = videoTopDistance;
            nearestVideo = i;
         }
      });
   }

   return nearestVideo;
}

function getVideoTopDistance(video) {
   let videoTopDistance = Math.abs(video.offsetTop - videoMainEl.scrollTop);
   return videoTopDistance;
}

function getNearestVideo(videos, offset = 0) {
   return videos[`${getNearestVideoIndex() + offset}`];
}

function scrollVideo(videoEl) {
   videoEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

function isMobile(video) {
   if (window.innerWidth < video.clientWidth * 2) return true;
   else return false;
}

function mobileScroll(videos, scrollStart, scrollStop) {
   let nearestVideo = getNearestVideo(videos);

   if (!isMobile(nearestVideo)) {
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
      if (nearestVideo.paused) setTimeout(() => togglePlay(nearestVideo), 200);
   }
}

function keyHandler(event) {
   event.preventDefault();

   let nearestVideo;

   if (
      (event.key === "j" || event.key === "J" || event.key === "ArrowDown") &&
      getNearestVideoIndex({ direction: "up" }) != videoCollection.length - 1
   ) {
      nearestVideo =
         videoCollection[`${getNearestVideoIndex({ direction: "up" }) + 1}`];
      scrollVideo(nearestVideo);
   } else if (
      (event.key === "k" || event.key === "K" || event.key === "ArrowUp") &&
      getNearestVideoIndex() > 0
   ) {
      nearestVideo = videoCollection[`${getNearestVideoIndex() - 1}`];
      scrollVideo(nearestVideo);
   } else if (event.key === " ") {
      nearestVideo = videoCollection[`${getNearestVideoIndex()}`];
      if (isMobile(nearestVideo)) {
         togglePlay(nearestVideo);
         return;
      }
   } else if (event.key === "f" || event.key === "F") {
      fullscreenCollection =
         videoMainEl.getElementsByClassName("pseudofullscreen");
      if (fullscreenCollection) {
         for (let i = 0; i < fullscreenCollection.length; i++) {
            fullscreenCollection[i].classList.remove("pseudofullscreen");
         }
         return;
      } else {
         forEachVideo((video) => {
            if (video.paused === false) {
               event.target.classList.add("pseudofullscreen");
               event.target.setAttribute("controls", "");
               event.target.play();
               return;
            }
         });
         return;
      }
   } else if (event.key === "Home") {
      nearestVideo = videoCollection[0];
      scrollVideo(nearestVideo);
   } else if (event.key === "End") {
      nearestVideo = videoCollection[`${videoCollection.length - 1}`];
      scrollVideo(nearestVideo);
   } else if (event.key === "s" || event.key === "S") {
      stopAllVideos();
   } else if (event.key === "m" || event.key === "M") {
      toggleMute();
   } else return;

   // We scrolled with keys to get here
   if (!nearestVideo) nearestVideo = getNearestVideo(videoCollection);
   if (isMobile(nearestVideo) && nearestVideo.paused)
      setTimeout(() => togglePlay(nearestVideo), 200);
}

function toTopHandler(event) {
   event.preventDefault();
   videoMainEl.scroll({ top: 0, left: 0, behavior: "smooth" });
}

function toBottomHandler(event) {
   event.preventDefault();
   videoMainEl.scroll({
      top: videoMainEl.scrollHeight,
      left: 0,
      behavior: "smooth"
   });
}

function stopHandler(event) {
   event.preventDefault();

   stopAllVideos();
}

function muteHandler(event) {
   event.preventDefault();

   toggleMute();
}

function favoriteHandler(event) {
   event.preventDefault();
   nearestVideo = getNearestVideo(videoCollection);
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

   nearestVideo = getNearestVideo(videoCollection);
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

   if (event.target.paused) {
      scrollVideo(event.target);
   }
   togglePlay(event.target);
}

function doubleClickHandler(event) {
   event.stopImmediatePropagation();

   let classList = [...event.target.classList];

   fullscreenCollection =
      videoMainEl.getElementsByClassName("pseudofullscreen");
   for (let i = 0; i < fullscreenCollection.length; i++) {
      fullscreenCollection[i].classList.remove("pseudofullscreen");
   }

   if (!classList.includes("pseudofullscreen")) {
      event.target.classList.add("pseudofullscreen");
      event.target.setAttribute("controls", "");
      // event.target.play();
   }
}

function touchHandler(event) {
   if (event.type === "touchstart") {
      touchStartY = videoMainEl.scrollTop;
   } else if (event.type === "touchend") {
      touchEndY = videoMainEl.scrollTop;
      mobileScroll(videoCollection, touchStartY, touchEndY);
   }
}

toTopEl.addEventListener("click", toTopHandler);
toBottomEl.addEventListener("click", toBottomHandler);
stopEl.addEventListener("click", stopHandler);
muteEl.addEventListener("click", muteHandler);
faveEl.addEventListener("click", favoriteHandler);
hideEl.addEventListener("click", hideHandler);

videoMainEl.addEventListener("click", clickHandler);
//videoMainEl.addEventListener("dblclick", doubleClickHandler);
videoMainEl.addEventListener("touchstart", touchHandler);
videoMainEl.addEventListener("touchend", touchHandler);

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
      .then((userData) => {
         user.videos.forEach((videoObject) => {
            if (videoObject?.uploader_id) {
               user.id = videoObject.uploader_id;
               userLinkEl.setAttribute("href", `https://tiktok.com/@${user.id}`);
               return;
            } else if (user?.id === undefined) {
               user.id = "";
            }
         });

         // Create Video Elements from user.videos array
         createVideos(userData);
      })
      .catch((err) => {
         throw err;
      });

   s_Favorites = getFavorites();
   s_Hidden = getHidden();
   s_Muted = getMuted();
   if (s_Muted) {
      muteEl.textContent = "volume_off";
   } else {
      muteEl.textContent = "volume_up";
   }
});

// Load videos after initial content is rendered
window.addEventListener("load", () => {});
