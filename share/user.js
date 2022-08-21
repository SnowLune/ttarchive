const MOBILE_BREAK = 600;

var scrolling;
var fingerHeld;

var scrollTimeout;

const videoCollection = document.getElementsByClassName("video-post");

function togglePlay(video) {
   if (video.paused) {
      for (let i = 0; i < videoCollection.length; i++) {
         if (videoCollection[i].paused === false) videoCollection[i].pause();
      }
      video.play();
   } else video.pause();
}

function alignedToVideo() {
}

// Get the index of the video closest to the top of the viewport 
function getNearestVideo() {
   var nearestVideoDistance = 10 ** 10;
   var nearestVideo;

   for (var i = 0; i < videoCollection.length; i++) {
      let videoTopDistance = Math.abs(videoCollection[i].offsetTop - videoMain.scrollTop);
      if (videoTopDistance < nearestVideoDistance) {
         nearestVideoDistance = videoTopDistance;
         nearestVideo = i;
      }
   }

   return nearestVideo;
}

function scrollVideo(videoEl) {
   videoEl.scrollIntoView({ behavior: "smooth", block: "end" })
}

function mobileScroll(videos) {
   let halfScreen = videoMain.clientHeight / 2;

   for (let i = 0; i < videos.length; i++) {
      var videoTopDistance = Math.abs(videos[i].offsetTop - videoMain.scrollTop)
      
      if (videoTopDistance <= halfScreen) {
         scrollVideo(videos[i]);

         if (window.innerWidth < videos[i].clientWidth * 2 && videos[i].paused)
            setTimeout(() => togglePlay(videos[i]), 250);
         break;
      }
   }

   console.log(getNearestVideo())
}

function scrollHandler() {
   if (fingerHeld || scrolling) return;

   clearTimeout(scrollTimeout);
   scrollTimeout = setTimeout(() => mobileScroll(videoCollection), 50);
}

var toTop_el = document.querySelector(".to-top-icon a");
var toBottom_el = document.querySelector(".to-bottom-icon a");

toTop_el.addEventListener("click", (event) => {
   event.preventDefault();
   videoMain.scroll({ top: 0, left: 0, behavior: "smooth" });
});

toBottom_el.addEventListener("click", (event) => {
   event.preventDefault();
   videoMain.scroll({
      top: videoMain.scrollHeight,
      left: 0,
      behavior: "smooth",
   });
});

var videoMain = document.querySelector(".video-main");

videoMain.addEventListener("click", (event) => {
   // Return if row size is 1 video
   // if (window.innerWidth < (videos[i].clientWidth * 2))
   //    return;
   if (event.target.paused) {
      scrollVideo(event.target)
   }
   togglePlay(event.target);
});

videoMain.addEventListener("dblclick", (event) => {
   event.target.requestFullscreen();
   event.target.play();
   event.target.controls
      ? (event.target.controls = false)
      : (event.target.controls = true);
});

videoMain.addEventListener("touchstart", () => {
   fingerHeld = true;
});

videoMain.addEventListener("touchend", () => {
   fingerHeld = false;
   mobileScroll(videoCollection);
});

videoMain.addEventListener("scroll", scrollHandler);
