#!/bin/bash

ttgetConfig=~/.config/ttget/ttget.config

if [ -f "$ttgetConfig" ]; then
   . "$ttgetConfig"
fi

if [ "$ttgetHome" = "" ]; then
   echo "ttgetHome environment variable not set. Exiting..."
   exit 1
fi

if [ "$ttgetShare" = "" ]; then
   ttgetShare=~/.local/share/ttget
fi

if [ ! -d "$ttgetShare" ]; then
   echo "ERROR: $ttgetShare is missing. Exiting..."
   exit 1
fi

if [ "$1" = "" ]; then
   echo "ERROR: No input file or username provided."
   exit 1
fi

if [ ! -f "$1" ]; then
   # Check for user directory
   if [ -d "$ttgetHome"/"$1" ]; then
      if [ -f "$ttgetHome"/"$1"/"$1".list ]; then
         echo "Found URL list for $1"
         inputFile="$ttgetHome"/"$1"/"$1".list
      else
         echo "ERROR: Found user directory but no URL list for $1."
         echo "Please save a new HTML page for $1. Exiting..."
         exit 1
      fi
   else
      echo "ERROR: No user directory for $1 found."
      echo "Please save a new HTML page for $1. Exiting..."
      exit 1
   fi
else
   inputFile="$1"
fi

# Set username
username=`ls "$inputFile" | sed -e 's%^.*@%@%' -e 's%).*$%%' -e 's%.list%%'`

# Check if filename gave us a valid username
if [ "$username" = "" ] || [ "${username:0:1}" != "@" ]; then
   echo "ERROR: Invalid input filename. Must contain @username."
   exit 1
fi

outputDir="$ttgetHome"/"$username"

if [ -d "$outputDir" ]; then
   echo "Found user file for $username."
   if [ ! -d "$outputDir"/video ]; then
      echo "No video directory found. Creating one..."
      mkdir -p "$outputDir"/video
   fi
else
   mkdir -p "$outputDir"/video
fi

videoList=$(grep -o -E "https://www.tiktok.com/$username/video/[[:digit:]]+" "$inputFile")
videoListFile="$outputDir"/"$username".list
echo $videoList | tr " " "\n" > "$videoListFile"

# Create list of mp4s
localVideoFiles=$(find "$outputDir"/video -maxdepth 1 -type f -iregex ".*.mp4")

for i in $localVideoFiles; do 
   # Cut out ID
   currentID=$(basename -s .mp4 "$i")
   
   if [[ "$currentID" != "" ]]; then
      echo "Found $username video: $currentID"

      # Remove videos from videoList
      tempVideoList=$(echo $videoList \
         | sed "s#https://www.tiktok.com/$username/video/$currentID##")

      # Save videoList
      videoList=$tempVideoList
   fi
done

echo $videoList | tr " " "\n" > "$videoListFile".tmp

if [ "$videoList" != "" ]; then
   echo -n "Found $(echo $videoList | tr " " "\n" | sed '/^$/d' | wc -l) new videos "
   echo "from $username"
   echo "Starting download..."

   yt-dlp -f "b*[vcodec=h264]" --progress --write-thumbnail --write-description --write-info-json --no-mtime --no-overwrites \
      -P "$outputDir/video" -o "%(id)s.%(ext)s" --sleep-interval 0.5 \
      -a "$videoListFile".tmp

else
   echo "No new videos from $username"
fi

# Check metadata
echo "Validating metadata using primary video list..."
# Overwrite temp file
echo -n "" > "$videoListFile".tmp

function addToMissingMetadataList {
   echo "$i" >> "$videoListFile".tmp
}

for i in $(cat "$videoListFile" | sed '/^$/d'); do
   currentID=$(echo "$i" | sed "s%^.*/%%")
   # Check for missing metadata
   if [ ! -f "$outputDir"/video/"$currentID".description ]; then
      addToMissingMetadataList
   elif [ ! -f "$outputDir"/video/"$currentID".info.json ]; then
      addToMissingMetadataList
   elif [ ! -f "$outputDir"/video/"$currentID".webp ]; then
      addToMissingMetadataList
   fi
done

if [ "$(cat "$videoListFile".tmp)" != "" ]; then
   missingCount=$(cat "$videoListFile".tmp | sed '/^$/d' |  wc -l)
   echo "Missing metadata for $missingCount video$([ "$missingCount" -gt 1 ] && echo "s")."
   echo "Downloading missing metadata..."
   yt-dlp --skip-download --write-thumbnail --write-description --write-info-json --no-mtime --no-overwrites \
      -P "$outputDir/video" -o "%(id)s.%(ext)s" --sleep-interval 0.1 \
      -a "$videoListFile".tmp
else
   echo "Successfully validated video metadata."
fi

####################
# Generate homepage
####################

# Make directories and copy files

if [ ! -d "$ttgetHome" ]; then
   mkdir "$ttgetHome"
fi

if [ ! -d "$ttgetHome"/assets ]; then
   mkdir "$ttgetHome"/assets
fi

cp "$ttgetShare"/home.html "$ttgetHome"/index.html
cp -ur "$ttgetShare"/assets "$ttgetHome"

# Set user link components
userLinkComponent=$(cat $ttgetShare/components/user-link.html | tr -d "\n")
userThumbComponent=$(cat $ttgetShare/components/user-preview-image.html \
   | tr -d "\n")
userThumbRowComponent=$(cat \
   $ttgetShare/components/user-gallery-preview-row.html | tr -d "\n")
userLinkElements=""

### Loop through all user directories
for i in "$ttgetHome"/@*; do
   currentUsername=$(basename "$i")

   # Thumbnails for homepage
   userThumbElements=""
   userThumbRowElements=""
   cd "$ttgetHome"/"$currentUsername"
   thumbnails=$(find video/*.webp -maxdepth 1 -type f -iname "*.webp" | sort \
      | tail -9)
   for j in {1..9}; do
      previewThumb=$(echo $thumbnails | tr " " "\n" | sed -n "$j"p)
      if [ "$previewThumb" = "" ]; then break; fi
      
      tempUserThumbElements=$userThumbElements
      newUserThumbElement=$(echo "$userThumbComponent" | sed "s#THUMBNAIL_URI#./$currentUsername/$previewThumb#")
      userThumbElements="$newUserThumbElement""$tempUserThumbElements"

      if [ $(($j % 3)) -eq 0  ]; then
         tempUserThumbRowElements=$userThumbRowElements
         newUserThumbRowElement=$(echo $userThumbRowComponent | sed "s#PREVIEW_IMAGES#$userThumbElements#")
         userThumbRowElements="$newUserThumbRowElement""$tempUserThumbRowElements"
         userThumbElements=""
      fi
   done

   tempUserLinkElements=$userLinkElements
   newUserLink=$(echo "$userLinkComponent" | sed -e "s#USERNAME#$currentUsername#g" \
      -e "s#PREVIEW_ROWS#$userThumbRowElements#")
   userLinkElements="$tempUserLinkElements""$newUserLink"

   # Create HTML for user
   cp $ttgetShare/user.html "$ttgetHome"/"$currentUsername"/index.html

   videoComponent=$(cat $ttgetShare/components/video.html | tr -d "\n")

   # Generate <video> elements
   echo "Generating html for $currentUsername..."
   cd "$ttgetHome"/"$currentUsername"/video

   for i in *.mp4; do
      # Thumbnail file
      thumbnail=$(echo $i | sed 's#mp4#webp#')

      # If the thumbnail doesn't exist preload the video
      if [ -f "$thumbnail" ]; then
         newVideoElement=$(echo "$videoComponent" \
            | sed -e "s%VIDEO_FILE%./video/$i%" \
            -e "s%VIDEO_THUMBNAIL%./video/$thumbnail%" \
            -e "s%BACKGROUND_THUMBNAIL%./video/$thumbnail%")
      else
         newVideoElement=$(echo "$videoComponent" \
            | sed -e "s%VIDEO_FILE%./video/$i%" \
            -e "s%VIDEO_THUMBNAIL%%" -e "s%preload=\"none\"%preload=\"metadata\"%")
      fi
      sed -i "s%VIDEO_MAIN_ELEMENTS%VIDEO_MAIN_ELEMENTS$newVideoElement%g" "$ttgetHome"/"$currentUsername"/index.html
   done

   sed -i "s%USERNAME%$currentUsername%g" "$ttgetHome"/"$currentUsername"/index.html
   sed -i "s%VIDEO_MAIN_ELEMENTS%%g" "$ttgetHome"/"$currentUsername"/index.html

   if [ -f "$outputDir"/index.html ]; then
      echo "Generated html page for $currentUsername: $ttgetHome/$currentUsername/index.html"
   fi
done

sed -i "s#USER_LINKS#$userLinkElements#g" "$ttgetHome"/index.html

if [ -f "$ttgetHome"/index.html ]; then
   echo "Generated ttget home page: $ttgetHome/index.html"
fi

# Delete temp file
if [ -f "$videoListFile".tmp ]; then
   rm "$videoListFile".tmp
fi

exit
