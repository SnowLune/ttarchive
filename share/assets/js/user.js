// Globals
var fingerHeld;
var videoCollection;

// Global Elements
var mainEl = document.getElementById("main");
var userStatusEl = document.querySelector(".username-status");
var videoMainEl = document.querySelector(".video-main");
var toTopEl = document.querySelector(".to-top-icon a");
var toBottomEl = document.querySelector(".to-bottom-icon a");

function createLoader() {
   let loader = document.createElement("h3");
   loader.innerText = "Loading...";
   return loader;
}

function createVideoElement(videoObject) {
   return new Promise((resolve) => {
      let videoEl = document.createElement("video");
      videoEl.className = "video-post";
      if (videoObject.description) videoEl.setAttribute("preload", "none");
      else videoEl.setAttribute("preload", "metadata");

      videoEl.setAttribute("poster", `${videoObject.thumbnail}`);
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("x5-playsinline", "true");
      videoEl.setAttribute("webkit-playsinline", "true");
      videoEl.setAttribute("tabindex", "2");
      videoEl.setAttribute("loop", "");
      videoEl.setAttribute("mediatype", "video");
      videoEl.setAttribute(
         "style",
         `background-image: url("${videoObject.thumbnail}")\
            ; background-repeat: no-repeat\
            ; background-position: center\
            ; background-size: contain`
      );
      videoEl.setAttribute("src", videoObject.file);
      videoMainEl.appendChild(videoEl);

      setTimeout(resolve, 0.01);
   });
}

async function createVideos(user) {
   try {
      let loader = createLoader();
      userStatusEl.appendChild(loader);

      for (let i = 0; i < user.videos.length; i++) {
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
      for (let i = 0; i < videoCollection.length; i++) {
         if (videoCollection[i].paused === false) videoCollection[i].pause();
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
      for (var i = 0; i < videoCollection.length; i++) {
         let videoTopDistance = getVideoTopDistance(videoCollection[i]);
         if (videoTopDistance < nearestVideoDistance) {
            nearestVideoDistance = videoTopDistance;
            nearestVideo = i;
         }
      }
   }

   return nearestVideo;
}

function getVideoTopDistance(video) {
   let videoTopDistance = Math.abs(video.offsetTop - videoMainEl.scrollTop);
   return videoTopDistance;
}

function scrollVideo(videoEl) {
   videoEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

function isMobile(video) {
   if (window.innerWidth < video.clientWidth * 2) return true;
   else return false;
}

function mobileScroll(videos) {
   let halfScreen = videoMainEl.clientHeight / 2;

   for (let i = 0; i < videos.length; i++) {
      var videoTopDistance = getVideoTopDistance(videos[i]);

      if (videoTopDistance <= halfScreen) {
         scrollVideo(videos[i]);

         if (isMobile(videos[i]) && videos[i].paused)
            setTimeout(() => togglePlay(videos[i]), 200);
         break;
      }
   }
}

function keyHandler(event) {
   event.preventDefault();

   let nearestVideo;

   if (
      (event.key === "j" || event.key === "ArrowDown") &&
      getNearestVideoIndex({ direction: "up" }) != videoCollection.length - 1
   ) {
      nearestVideo =
         videoCollection[`${getNearestVideoIndex({ direction: "up" }) + 1}`];
      scrollVideo(nearestVideo);
   } else if (
      (event.key === "k" || event.key === "ArrowUp") &&
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
   } else if (event.key === "Home") {
      nearestVideo = videoCollection[0];
      scrollVideo(nearestVideo);
   } else if (event.key === "End") {
      nearestVideo = videoCollection[`${videoCollection.length - 1}`];
      scrollVideo(nearestVideo);
   } else return;

   // We scrolled with keys to get here
   if (!nearestVideo)
      nearestVideo = videoCollection[`${getNearestVideoIndex()}`];
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
      behavior: "smooth",
   });
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
   event.target.requestFullscreen();
   event.target.play();
   if (event.target.controls) event.target.controls = false;
   else event.target.controls = true;
}

function touchHandler(event) {
   if (event.type === "touchstart") fingerHeld = true;
   else if (event.type === "touchend") {
      fingerHeld = false;
      mobileScroll(videoCollection);
   }
}

toTopEl.addEventListener("click", toTopHandler);
toBottomEl.addEventListener("click", toBottomHandler);

videoMainEl.addEventListener("click", clickHandler);
videoMainEl.addEventListener("dblclick", doubleClickHandler);
videoMainEl.addEventListener("touchstart", touchHandler);
videoMainEl.addEventListener("touchend", touchHandler);

document.addEventListener("keydown", keyHandler);

// Load videos after initial content is rendered
window.addEventListener("load", () => {
   createVideos(user);
});
