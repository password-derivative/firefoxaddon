# Argon2

NOTE: don't follow the below, these instructions are a work in progress.

For Argon2 you need:

Install Python 3.9 on Windows -> from the Mircosoft store
Install CMake from https://cmake.org/download/
--> cmake-3.22.1-windows-x86_64.msi
Install Visual Studio Community Edition
--> https://visualstudio.microsoft.com/
Select workload: Desktop development with C++.
you can find it here:
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.30.30705\bin\Hostx64\x64

Clone emscripten SDK version '3.1.1' to download and install the latest SDK tools.
Run a GIT command prompts in the emscripten directory:
```
./emsdk install latest
```

Make the "latest" SDK "active" for the current user. (writes .emscripten file)
```
./emsdk activate latest
```

Activate PATH and other environment variables in the current terminal
```
source ./emsdk_env.sh
```

In my case I got the following confirmation.
```
Setting the following tools as active:
   node-14.18.2-64bit
   python-3.9.2-1-64bit
   java-8.152-64bit
   releases-upstream-5ee64de9809592480da01372880ea11debd6c740-64bit
```	

Also clone argon2-browser
git clone --recursive https://github.com/antelle/argon2-browser.git


git clone https://github.com/P-H-C/phc-winner-argon2.git
git reset --hard 440ceb9

open agron2.sln

Now navigate to argon2-browser
PATH += /C/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.30.30705/bin/Hostx64/x64

Install emscripten SDK version '3.1.1', is described on: https://emscripten.org/docs/getting_started/downloads.html
Mozilla instructions on installing WebAssembly: https://developer.mozilla.org/en-US/docs/WebAssembly/C_to_wasm

Argon2 is interesting, but can generate different outputs across different platforms:
$argon2d$v=19$m=1024,t=1,p=1$Y3J5cHRvZ3JhcGh5X2FwcF9zdGF0aWNfc2FsdA$Db/nI/WY8DtjPUfBxE4nT8yFn2nMJ7QfAueDXZTdj2c (Windows nonewline)
$argon2d$v=19$m=1024,t=1,p=1$Y3J5cHRvZ3JhcGh5X2FwcF9zdGF0aWNfc2FsdA$4e687tbd0JrHA5cHLENRfg/oSyV6+/wNz5kmpwkiRGE (Windows newline)
$argon2d$v=19$m=1024,t=1,p=1$Y3J5cHRvZ3JhcGh5X2FwcF9zdGF0aWNfc2FsdA$6EJYBiJa50/kERmPc8+aXn+mzjqygMglb8jTAS2YG/Y (Windows with forced linux newline)
$argon2d$v=19$m=1024,t=1,p=1$Y3J5cHRvZ3JhcGh5X2FwcF9zdGF0aWNfc2FsdA$/YweHC6qqurm8YlkCxnnSo/XLgMtx99sU8Mxt1ewtZk (Firefox)