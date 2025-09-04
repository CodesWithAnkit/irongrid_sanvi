# Working with Git Submodules in IronGrid

This guide explains how to work with the Git submodules structure for the IronGrid project.

## Repository Structure

The IronGrid repository now uses Git submodules for managing the frontend and backend code:

- `sanvi-frontend`: Submodule for the frontend Next.js application
- `sanvi-backend`: Submodule for the backend NestJS application

## Setting Up Submodules

If you're cloning the repository for the first time:

```bash
git clone <main-repo-url>
git submodule init
git submodule update
```

This will initialize and fetch all data for the submodules.

## Making Changes to Submodules

### Option 1: Working directly in the submodule

1. Navigate to the submodule directory:
   ```bash
   cd sanvi-frontend
   # or
   cd sanvi-backend
   ```

2. Make your changes

3. Commit and push from within the submodule:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

4. Update the main repository to point to the new commit:
   ```bash
   cd ..  # Return to main repo
   git add sanvi-frontend  # or sanvi-backend
   git commit -m "Update submodule reference"
   git push
   ```

### Option 2: Using the --recurse-submodules flag

For pushing changes to all repositories at once:

```bash
git push --recurse-submodules=on-demand
```

## Pulling Changes

To pull changes including submodule updates:

```bash
git pull
git submodule update --recursive
```

## Deployment Process

The deployment process has been updated to:

1. CI pipeline triggers automatically only on pushes to `develop` or pull requests to `main`/`develop`
2. CD pipeline is manually triggered using GitHub Actions workflow dispatch
3. You can choose to deploy frontend, backend, or both during manual deployment

## Manual Deployment Steps

1. Go to the GitHub Actions tab in the repository
2. Select the "CD Pipeline" workflow
3. Click "Run workflow"
4. Choose the desired options:
   - Environment (staging or production)
   - Whether to deploy backend (yes/no)
   - Whether to deploy frontend (yes/no)
5. Click "Run workflow" to start the deployment

## Important Notes

- The main branch no longer triggers automatic builds when pushed
- Always commit submodule changes before committing to the main repository
- Use the manual deployment option in GitHub Actions to deploy your changes
