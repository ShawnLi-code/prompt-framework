!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$DESKTOP\提示词框架.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0 SW_SHOWNORMAL "" "选中文字，一键生成结构化提示词"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$DESKTOP\提示词框架.lnk"
!macroend
