@echo off
echo === IronGrid Git Repository Fix Script ===
echo This script will fix embedded Git repositories while preserving files.

rem Verify directories exist
if not exist sanvi-backend (
  echo Error: sanvi-backend directory not found
  goto :end
)
if not exist sanvi-frontend (
  echo Error: sanvi-frontend directory not found
  goto :end
)

echo.
echo === Step 1: Backing up content ===
echo Creating temporary backup folders...
mkdir temp-backend
mkdir temp-frontend

echo Copying sanvi-backend content to temp folder (excluding .git)...
xcopy /E /I /H /Y sanvi-backend temp-backend /EXCLUDE:exclude-git.txt

echo Copying sanvi-frontend content to temp folder (excluding .git)...
xcopy /E /I /H /Y sanvi-frontend temp-frontend /EXCLUDE:exclude-git.txt

echo.
echo === Step 2: Remove embedded Git repositories ===
echo Removing sanvi-backend from Git index...
git rm --cached sanvi-backend

echo Removing sanvi-frontend from Git index...
git rm --cached sanvi-frontend

echo.
echo === Step 3: Restore content without Git directories ===
echo Removing original directories...
rmdir /S /Q sanvi-backend
rmdir /S /Q sanvi-frontend

echo Creating new directories...
mkdir sanvi-backend
mkdir sanvi-frontend

echo Restoring content from backups...
xcopy /E /I /H /Y temp-backend\* sanvi-backend
xcopy /E /I /H /Y temp-frontend\* sanvi-frontend

echo Cleaning up temporary folders...
rmdir /S /Q temp-backend
rmdir /S /Q temp-frontend

echo.
echo === Step 4: Add content to main Git repository ===
echo Adding content to Git...
git add sanvi-backend
git add sanvi-frontend

echo.
echo === Completed ===
echo The repository structure has been fixed.
echo You can now proceed with committing the changes.

:end
pause
