ttget="./ttget.sh"
binName="ttget"
share="./share"

if [ -d ~/.local/bin ]; then
   cp -uv "$ttget" ~/.local/bin/"$binName"
else
   echo "~/.local/bin does not exist."
fi

if [ -d ~/.local/share ]; then
   cp -urv "$share"/* ~/.local/share/ttget
else
   echo "~/.local/share does not exist."
fi
