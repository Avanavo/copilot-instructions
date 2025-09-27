using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using System.Linq;

namespace Avanavo.CopilotInstructions
{
    public class InstallationLogic
    {
        public async Task<bool> InstallAsync(string targetDirectory)
        {
            try
            {
                if (Directory.Exists(targetDirectory))
                {
                    return await HandleExistingDirectoryAsync(targetDirectory);
                }
                else
                {
                    return await InstallFreshAsync(targetDirectory);
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Installation failed: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        private async Task<bool> HandleExistingDirectoryAsync(string targetDirectory)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"Directory {targetDirectory} already exists.");
            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine("What would you like to do?");
            Console.WriteLine("1. Skip installation (keep existing files)");
            Console.WriteLine("2. Backup existing and install fresh");
            Console.WriteLine("3. Merge with existing files");
            Console.WriteLine("4. Force overwrite (destructive)");
            Console.WriteLine("5. Cancel installation");
            Console.WriteLine();
            Console.Write("Please choose an option (1-5): ");

            var choice = Console.ReadLine();
            Console.WriteLine();

            switch (choice?.Trim())
            {
                case "1":
                    Console.WriteLine("Skipping installation. Existing files preserved.");
                    return true;

                case "2":
                    return await BackupAndInstallAsync(targetDirectory);

                case "3":
                    return await MergeInstallationAsync(targetDirectory);

                case "4":
                    return await ForceInstallAsync(targetDirectory);

                case "5":
                    Console.WriteLine("Installation cancelled.");
                    return false;

                default:
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("Invalid choice. Installation cancelled.");
                    Console.ResetColor();
                    return false;
            }
        }

        private async Task<bool> InstallFreshAsync(string targetDirectory)
        {
            Console.WriteLine("Installing copilot instructions...");
            return await ExtractEmbeddedResourcesAsync(targetDirectory);
        }

        private async Task<bool> BackupAndInstallAsync(string targetDirectory)
        {
            try
            {
                var backupDirectory = $"{targetDirectory}.backup.{DateTime.Now:yyyyMMdd-HHmmss}";
                Console.WriteLine($"Creating backup at: {backupDirectory}");
                
                Directory.Move(targetDirectory, backupDirectory);
                
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"Backup created successfully at: {backupDirectory}");
                Console.ResetColor();
                
                return await InstallFreshAsync(targetDirectory);
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Backup failed: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        private async Task<bool> MergeInstallationAsync(string targetDirectory)
        {
            Console.WriteLine("Merging with existing files...");
            // For merge, we extract to a temp directory first, then copy selectively
            var tempDirectory = Path.Combine(Path.GetTempPath(), $"copilot-instructions-{Guid.NewGuid()}");
            
            try
            {
                if (await ExtractEmbeddedResourcesAsync(tempDirectory))
                {
                    await MergeDirectoriesAsync(tempDirectory, targetDirectory);
                    Directory.Delete(tempDirectory, true);
                    return true;
                }
                return false;
            }
            finally
            {
                if (Directory.Exists(tempDirectory))
                {
                    Directory.Delete(tempDirectory, true);
                }
            }
        }

        private async Task<bool> ForceInstallAsync(string targetDirectory)
        {
            try
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("WARNING: This will permanently delete all existing files in .github directory!");
                Console.ResetColor();
                Console.Write("Type 'FORCE' to confirm: ");
                
                var confirmation = Console.ReadLine();
                if (confirmation?.Trim() == "FORCE")
                {
                    Directory.Delete(targetDirectory, true);
                    return await InstallFreshAsync(targetDirectory);
                }
                else
                {
                    Console.WriteLine("Force installation cancelled.");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Force installation failed: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        private async Task<bool> ExtractEmbeddedResourcesAsync(string targetDirectory)
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                var allResourceNames = assembly.GetManifestResourceNames();
                
                // Filter resources: include .github files but exclude workflows
                var resourceNames = allResourceNames
                    .Where(name => name.StartsWith("Avanavo.CopilotInstructions.") && !name.Contains(".workflows."))
                    .ToArray();

                if (!resourceNames.Any())
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("No embedded instruction files found!");
                    Console.ResetColor();
                    return false;
                }

                Directory.CreateDirectory(targetDirectory);

                foreach (var resourceName in resourceNames)
                {
                    // Convert resource name back to file path
                    // Resource names are like: Avanavo.CopilotInstructions.copilot-instructions.md or Avanavo.CopilotInstructions.copilot_roles.business_analyst.md
                    var relativePath = resourceName.Replace("Avanavo.CopilotInstructions.", "");
                    
                    // Convert underscore directories back to hyphens and proper path separators
                    if (relativePath.StartsWith("copilot_roles."))
                    {
                        relativePath = relativePath.Replace("copilot_roles.", "copilot-roles" + Path.DirectorySeparatorChar);
                    }
                    else if (relativePath.StartsWith("copilot_tech."))
                    {
                        relativePath = relativePath.Replace("copilot_tech.", "copilot-tech" + Path.DirectorySeparatorChar);
                    }
                    
                    var targetPath = Path.Combine(targetDirectory, relativePath);
                    var targetDir = Path.GetDirectoryName(targetPath);

                    if (!string.IsNullOrEmpty(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    using var resourceStream = assembly.GetManifestResourceStream(resourceName);
                    using var fileStream = File.Create(targetPath);
                    await resourceStream.CopyToAsync(fileStream);

                    Console.WriteLine($"Extracted: {relativePath}");
                }

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"Successfully installed copilot instructions to {targetDirectory}");
                Console.ResetColor();
                return true;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Extraction failed: {ex.Message}");
                Console.ResetColor();
                return false;
            }
        }

        private Task MergeDirectoriesAsync(string sourceDirectory, string targetDirectory)
        {
            foreach (var file in Directory.GetFiles(sourceDirectory, "*", SearchOption.AllDirectories))
            {
                var relativePath = Path.GetRelativePath(sourceDirectory, file);
                var targetPath = Path.Combine(targetDirectory, relativePath);
                var targetDir = Path.GetDirectoryName(targetPath);

                if (!string.IsNullOrEmpty(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                if (File.Exists(targetPath))
                {
                    Console.WriteLine($"Overwriting: {relativePath}");
                }
                else
                {
                    Console.WriteLine($"Adding: {relativePath}");
                }

                File.Copy(file, targetPath, true);
            }

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Merge completed successfully!");
            Console.ResetColor();
            
            return Task.CompletedTask;
        }
    }
}