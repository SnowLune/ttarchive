#!/bin/bash

ttarchiveConfig=~/.config/ttarchive/ttarchive.config

if [ -f "$ttarchiveConfig" ]; then
   . "$ttarchiveConfig"
else
   while true; do
      read -p "Config file does not exist, would you like to create it? (y/n): " createConfig
      case $createConfig in
         [Yy]* ) 
            echo "ttarchiveOutput=~/ttarchive" > $ttarchiveConfig
            if [ -f $ttarchiveConfig ]; then
               echo "Config file created: $ttarchiveConfig"
               . $ttarchiveConfig
            else
               echo "ERROR: Error creating config file."
            fi
            break;;
         [Nn]* ) 
            echo "Warning: ttarchive will fail if \"ttarchiveOutput\" is not set."; break;;
         * ) echo "Please answer yes or no.";;
      esac
   done
fi

if [ "$ttarchiveOutput" = "" ]; then
   echo "\"ttarchiveOutput\" environment variable not set. Exiting..."
   exit 1
else
   echo "ttarchive output directory set as \"$ttarchiveOutput\""
   if [ ! -d "$ttarchiveOutput" ]; then
      mkdir "$ttarchiveOutput"
   fi
fi

if [ "$ttarchiveShare" = "" ]; then
   ttarchiveShare=~/.local/share/ttarchive
fi

if [ ! -d "$ttarchiveShare" ]; then
   echo "ERROR: $ttarchiveShare is missing. Exiting..."
   exit 1
fi

if [ "$1" = "" ]; then
   echo "ERROR: No input file or username provided."
   exit 1
fi

# Check path for yt-dlp
if [ "$(which yt-dlp)" == "" ]; then
   echo "ERROR: yt-dlp not found. It is required to download content."
   echo "Please install the latest version. See: [https://github.com/yt-dlp/yt-dlp#installation]"
   exit 1
fi

# If input is a username instead of a file
if [ ! -f "$1" ]; then
   # Check for user directory
   if [ -d "$ttarchiveOutput"/user/"$1" ]; then
      if [ -f "$ttarchiveOutput"/user/"$1"/"$1".url.list ]; then
         echo "Found URL list for $1 ."
         inputFile="$ttarchiveOutput"/user/"$1"/"$1".url.list
      else
         echo "ERROR: Found user directory but no URL list for $1 ."
         echo "Please save a new HTML page for $1 . Exiting..."
         exit 1
      fi
   
   else
      echo "ERROR: No user directory for $1 found."
      echo "Please save a new HTML page for $1 . Exiting..."
      exit 1
   fi
else
   inputFile="$1"
fi

# Set username from input filename
username=`ls "$inputFile" | sed -e 's%^.*@%@%' -e 's%).*$%%' -e 's%.url.list%%'`

# Check if filename gave us a valid username
if [ "$username" = "" ] || [ "${username:0:1}" != "@" ]; then
   echo "ERROR: Invalid input filename. Must contain @username. Exiting..."
   exit 1
fi

# Directory for this user
userOutputDir="$ttarchiveOutput"/user/"$username"

# Create /user directory if it does not exist
if [ ! -d "$ttarchiveOutput"/user ]; then
   mkdir "$ttarchiveOutput"/user
   # Can safely assume if /user doesn't exist then @username dir doesn't exist
   mkdir "$userOutputDir" "$userOutputDir"/video

# User directory exists
elif [ -d "$userOutputDir" ]; then
   echo "Found user directory for $username ."

   # User's video directory DOES NOT exist
   if [ ! -d "$userOutputDir"/video ]; then
      echo "No video directory found. Creating one..."
      mkdir "$userOutputDir"/video

   # User's video directory DOES exist
   elif [ -d "$userOutputDir"/video ]; then
      echo "Found video directory for $username ."

   # Catch
   else
      echo "READ ERROR: Error reading directories"
      exit 1
   fi

# User directory DOES NOT exist
elif [ ! -d "$userOutputDir" ]; then
   echo "No user directory found for $username . Creating one..."
   mkdir "$userOutputDir" "$userOutputDir"/video

# Catch
else
   echo "READ ERROR: Error reading directories"
   exit 1
fi

# List of video URLs grepped from the user's TikTok webapp page
videoList=$(grep -o -E "https://www.tiktok.com/$username/video/[[:digit:]]+" "$inputFile")
videoListFile="$userOutputDir"/"$username".url.list
echo $videoList | tr " " "\n" > "$videoListFile"

# Create list of mp4s
localVideoFiles=$(find "$userOutputDir"/video -maxdepth 1 -type f -iregex ".*.mp4")

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
   echo -n "Found $(echo $videoList | tr " " "\n" | sed '/^$/d' | wc -l) "
   echo "new videos from $username ."
   echo "Starting download..."

   yt-dlp -f "b*[vcodec=h264]" --write-thumbnail --write-description \
      --write-info-json --no-mtime --no-overwrites \
      -P "$userOutputDir/video" -o "%(id)s.%(ext)s" --sleep-interval 1 \
      --progress -a "$videoListFile".tmp

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
   if [ ! -f "$userOutputDir"/video/"$currentID".description ]; then
      addToMissingMetadataList
   elif [ ! -f "$userOutputDir"/video/"$currentID".info.json ]; then
      addToMissingMetadataList
   elif [ ! -f "$userOutputDir"/video/"$currentID".webp ]; then
      addToMissingMetadataList
   fi
done

if [ "$(cat "$videoListFile".tmp)" != "" ]; then
   missingCount=$(cat "$videoListFile".tmp | sed '/^$/d' |  wc -l)
   echo "Missing metadata for $missingCount video$([ "$missingCount" -gt 1 ] && echo "s")."
   echo "Downloading missing metadata..."
   yt-dlp --skip-download --write-thumbnail --write-description --write-info-json --no-mtime --no-overwrites \
      -P "$userOutputDir/video" -o "%(id)s.%(ext)s" --sleep-interval 0.1 \
      -a "$videoListFile".tmp
else
   echo "Successfully validated video metadata."
fi

####################
# Generate homepage
####################

# Make directories and copy files
if [ ! -d "$ttarchiveOutput"/assets ]; then
   mkdir "$ttarchiveOutput"/assets
fi

cp "$ttarchiveShare"/home.html "$ttarchiveOutput"/index.html
cp -ur "$ttarchiveShare"/assets "$ttarchiveOutput"

# Set user link components
userLinkComponent=$(cat $ttarchiveShare/components/user-link.html | tr -d "\n")
userThumbComponent=$(cat $ttarchiveShare/components/user-preview-image.html \
   | tr -d "\n")
userThumbRowComponent=$(cat \
   $ttarchiveShare/components/user-gallery-preview-row.html | tr -d "\n")
userLinkElements=""

### Loop through all user directories
for i in "$ttarchiveOutput"/user/@*; do
   # Current user
   currentUsername=$(basename "$i")
   # Current user directory
   userDir="$ttarchiveOutput"/user/"$currentUsername"
   # User video directory
   userVideoDir="$ttarchiveOutput"/user/"$currentUsername"/video

   # List of all video files for this user
   userVideoFileList="$userDir"/"$currentUsername".file.list
   # Create a blank file if it doesn't exist
   if [ ! -f "$userVideoFileList" ]; then touch "$userVideoFileList"; fi

   # Thumbnails for homepage
   userThumbElements=""
   userThumbRowElements=""
   cd "$userDir"
   thumbnails=$(find video/*.webp -maxdepth 1 -type f -iname "*.webp" | sort \
      | tail -9)
   for j in {1..9}; do
      previewThumb=$(echo $thumbnails | tr " " "\n" | sed -n "$j"p)
      if [ "$previewThumb" = "" ]; then break; fi
      
      tempUserThumbElements=$userThumbElements
      newUserThumbElement=$(echo "$userThumbComponent" | sed "s#THUMBNAIL_URI#./user/$currentUsername/$previewThumb#")
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

   #
   # Create HTML for user
   #
   templateUserPage="$ttarchiveShare"/user.html
   userPage="$userDir"/index.html

   if [ "$templateUserPage" -nt "$userPage" ] \
      || [ "$(ls -1 "$userVideoDir")" != "$(cat "$userVideoFileList")" ]; then
      # Create new video file list
      ls -1 "$userVideoDir" > "$userVideoFileList"

      # Copy template
      cp "$templateUserPage" "$userPage"

      # Create videos.json
      userVideosJSON="$userDir"/videos.json
      cat "$ttarchiveShare"/videos.json | tr "\n" " " \
         | sed 's/].*$//' > "$userVideosJSON"

      ### Generate video javascript object
      echo "Generating videos.json for $currentUsername..."
      cd "$userVideoDir"

      # Last mp4 file in list
      lastMp4=$(ls -1 *.mp4 | tail -1)

      # For each video file
      for i in *.mp4; do
         # ID
         currentID=$(basename -s .mp4 "$i")
         
         # Copy contents of info.json into videos.json
         if [ -f "$currentID".info.json ]; then
            cat "$currentID".info.json >> "$userVideosJSON"
         else
            echo "ERROR: missing $currentID.info.json"
            echo "Using workaround..."
            if [ -f "$currentID".description ]; then
               description=$(cat "$currentID".description | tr "\n" " ")
            else
               description=""
            fi
            echo -n "{\"id\": \"$currentID\"," \
               "\"description\": \"$description\"}" >> "$userVideosJSON"
         fi

         if [ "$i" != "$lastMp4" ]; then
               echo -n "," >> "$userVideosJSON"
         fi
      done

      echo -n "]}" >> "$userVideosJSON"

      sed -i "s%USERNAME%$currentUsername%g" "$userPage"

      if [ -f "$userPage" ]; then
         echo "Generated html page for $currentUsername: "$userPage""
      fi
   else
      echo "JSON for $currentUsername is already up to date."
   fi
done

sed -i "s#USER_LINKS#$userLinkElements#g" "$ttarchiveOutput"/index.html

if [ -f "$ttarchiveOutput"/index.html ]; then
   echo "Generated ttarchive home page: $ttarchiveOutput/index.html"
fi

# Delete temp file
if [ -f "$videoListFile".tmp ]; then
   rm "$videoListFile".tmp
fi

exit
