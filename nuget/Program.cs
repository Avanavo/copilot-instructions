using System;
using System.IO;
using System.Threading.Tasks;

namespace Avanavo.CopilotInstructions
{
    class Program
    {
        static async Task<int> Main(string[] args)
        {
            try
            {
                Console.WriteLine("Avanavo GitHub Copilot Instructions Setup");
                Console.WriteLine("=========================================");
                Console.WriteLine();
                Console.WriteLine("This tool installs GitHub Copilot agentic development instructions");
                Console.WriteLine("for role-based, disciplined software development.");
                Console.WriteLine();

                var currentDirectory = Directory.GetCurrentDirectory();
                var gitHubDirectory = Path.Combine(currentDirectory, ".github");

                Console.WriteLine($"Installing copilot instructions to: {currentDirectory}");
                Console.WriteLine();

                var installer = new InstallationLogic();
                var success = await installer.InstallAsync(gitHubDirectory);

                if (success)
                {
                    Console.WriteLine();
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("🎉 Setup completed successfully!");
                    Console.ResetColor();
                    Console.WriteLine();
                    Console.WriteLine("Next steps:");
                    Console.WriteLine("1. Open GitHub Copilot in your IDE");
                    Console.WriteLine("2. Start any conversation - Copilot will propose the appropriate role");
                    Console.WriteLine("3. Begin disciplined, role-based development!");
                    Console.WriteLine();
                    Console.WriteLine("📖 Learn more: https://github.com/Avanavo/copilot-instructions");
                }

                return success ? 0 : 1;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Error: {ex.Message}");
                Console.ResetColor();
                return 1;
            }
        }
    }
}