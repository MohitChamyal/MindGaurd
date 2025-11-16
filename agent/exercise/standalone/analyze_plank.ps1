# PowerShell script to analyze the latest plank video
# This can be called from the frontend using child_process.exec

# Get the directory of this script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Construct the path to the Python script
$pythonScript = Join-Path -Path $scriptDir -ChildPath "analyze_latest.py"

# Run the Python script and capture the output
try {
    $result = python $pythonScript
    # Return the JSON result
    Write-Output $result
} catch {
    # Handle errors
    $errorJson = @{
        success = $false
        treasureAwarded = $false
        error = "Failed to run Python script: $_"
    } | ConvertTo-Json
    
    Write-Output $errorJson
} 