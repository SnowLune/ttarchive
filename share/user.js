const MOBILE_BREAK = 600;

var videoCollection = document.getElementsByClassName("video-post");
console.log(videoCollection);

function togglePlay(video) {
   if (video.paused) {
      for (let i = 0; i < videoCollection.length; i++) {
         if (videoCollection[i].paused === false)
            videoCollection[i].pause();
      }
      video.play();
   } else video.pause();
}

function mobileScroll(videos, scrollTimeout) {
   let viewportHeight = window.innerHeight;
   for (let i = 0; i < videos.length; i++) {
      if (Math.abs(videos[i].offsetTop - window.scrollY) < viewportHeight / 2) {
         videos[i].scrollIntoView({ behavior: "smooth", block: "end" });
         if (window.innerWidth < (videos[i].clientWidth * 2) && videos[i].paused)
            setTimeout(() => togglePlay(videos[i]), 250);
         break;
      }
   }
}

var toTop = document.querySelector(".to-top-icon a");
var toBottom = document.querySelector(".to-bottom-icon a");

toTop.addEventListener("click", (event) => {
   event.preventDefault();
   window.scroll({top: 0, left: 0, behavior: "smooth"});
});

toBottom.addEventListener("click", (event) => {
   event.preventDefault();
   window.scroll({top: document.body.scrollHeight, left: 0, behavior: "smooth"});
});

var videoMain = document.querySelector(".video-main");

videoMain.addEventListener("click", (event) => {
   if (event.target.paused) {
      event.target.scrollIntoView({ behavior: "smooth", block: "end" });
   }
   togglePlay(event.target);
});

videoMain.addEventListener("dblclick", (event) => {
   event.target.requestFullscreen();
   event.target.play();
   event.target.controls = true;
});

let scrollT;
videoMain.addEventListener("touchend", (event) => {
   clearTimeout(scrollT);
   scrollT = setTimeout(() => mobileScroll(videoCollection, scrollT), 50);
})

let scrollD;
document.addEventListener("scroll", (event) => {
   clearTimeout(scrollD);
   scrollD = setTimeout(() => mobileScroll(videoCollection, scrollD), 100);
})
