// Constants
const videoCollection = document.getElementsByClassName("video-post");

// Globals
var fingerHeld;

// Global Elements
var videoMainEl = document.querySelector(".video-main");
var toTopEl = document.querySelector(".to-top-icon a");
var toBottomEl = document.querySelector(".to-bottom-icon a");

function togglePlay(video) {
   if (video.paused) {
      for (let i = 0; i < videoCollection.length; i++) {
         if (videoCollection[i].paused === false) videoCollection[i].pause();
      }
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
   } else return;

   // We scrolled with keys to get here
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
