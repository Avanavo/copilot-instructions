# GitHub Copilot Instructions - Agentic Development Principles

A comprehensive **role-based framework** that transforms GitHub Copilot into a disciplined development agent, operating within defined professional roles to ensure requirements-first, assumption-free software development.

## 🎯 What This Framework Provides

Transform GitHub Copilot from a general coding assistant into a **professional development agent** that:

- ✅ **Operates within defined expertise roles** (Solution Architect, Business Analyst, Developer, QA, DevOps, Technical Writer)
- ✅ **Asks for requirements before coding** instead of making assumptions
- ✅ **Implements exactly what was agreed upon** with proposal-to-implementation fidelity
- ✅ **Traces every change back to requirements** with clear requirement IDs
- ✅ **Escalates conflicts professionally** through Solution Architect authority
- ✅ **Prevents unrequested feature creep** through anti-assumption protocols

## 🚀 Quick Start

### JavaScript/TypeScript/Node.js Projects
```bash
npx @avanavo/copilot-instructions
```

### .NET/C#/DevExpress Projects  
```bash
dotnet tool install -g Avanavo.CopilotInstructions
avanavo-copilot-setup
```

After installation, start any conversation with GitHub Copilot and it will propose the appropriate role for your request.

## 📋 Prerequisites

### GitHub CLI (Required for Release Management)

For automated release creation and publishing, you need GitHub CLI installed and authenticated:

**Installation:**
- **Windows**: `winget install --id GitHub.cli` or download from [GitHub CLI releases](https://github.com/cli/cli/releases)
- **macOS**: `brew install gh` or download from [GitHub CLI releases](https://github.com/cli/cli/releases)  
- **Linux**: See [GitHub CLI installation guide](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)

**Authentication:**
```bash
gh auth login
```
Follow the prompts to authenticate with your GitHub account.

**Verification:**
```bash
gh --version
gh auth status
```

For detailed installation and authentication instructions, see the [official GitHub CLI documentation](https://cli.github.com/manual/).

## 🎭 Available Professional Roles

| Role | When It Activates | Key Responsibilities |
|------|------------------|---------------------|
| **Solution Architect** | "escalation", "conflict", "architecture decision" | Technical leadership, cross-role coordination, architectural decisions |
| **Software Architect** | "system design", "API design", "architecture" | Technical specifications, design patterns, system structure |
| **Business Analyst** | "requirements", "user story", "specification" | Functional requirements, acceptance criteria, business rules |
| **Software Developer** | "implement", "code", "build", "function" | Implementation with requirement traceability, unit testing |
| **QA Engineer** | "test", "validate", "quality", "coverage" | Test planning, validation strategies, quality assurance |
| **DevOps Engineer** | "deploy", "CI/CD", "infrastructure", "pipeline" | Infrastructure, deployment, monitoring, automation |
| **Technical Writer** | "documentation", "README", "API docs" | User guides, technical documentation, process docs |

## 💡 How It Works

### 1. **Role Proposal** (Automatic)
```
You: "I need user authentication in my app"
Copilot: "This appears to be a Business Analyst task. Should I proceed with Business Analyst instructions?"
```

### 2. **User Confirmation** (Required)
```
You: "Yes, proceed"
```

### 3. **Role-Based Operation**
```
Copilot: [As Business Analyst] "I'll help create the authentication specification. 
What authentication methods do you require? What are the security requirements? 
Should I create user stories with acceptance criteria?"
```

### 4. **Role Switching** (When Needed)
```
You: "Now implement the login API"
Copilot: "This seems better suited for Software Developer role. Should I switch to Software Developer?"
You: "Yes"
Copilot: [As Developer] "I need the approved authentication specification first..."
```

## 🔍 Core Framework Principles

### Requirements-First Development
- **No code without approved requirements**
- **Every implementation references specific requirement IDs**
- **Requirements must be clear before development begins**

### Anti-Assumption Protocols
- **Never add unrequested features** or "helpful" additions
- **Ask for clarification** when uncertainty > 10%
- **Label suggestions explicitly**: "You didn't ask for this, but would you like me to suggest..."

### Deterministic Implementation
- **Implement exactly what was proposed and agreed upon**
- **No regeneration or "improvement" of agreed content**
- **Proposal-to-implementation fidelity is mandatory**

### Professional Boundaries
- **Stay within role expertise domains**
- **Escalate cross-role conflicts to Solution Architect**
- **Respect other roles' responsibilities**

## 📋 Example Interactions

### Business Analyst Session
```
You: "I need user authentication"

BA: "I'll create the authentication specification. Let me understand your requirements:

1. What authentication methods? (email/password, OAuth, 2FA)
2. What user types need access?
3. What are the security requirements?
4. Do you need password reset functionality?
5. Should I create user stories with acceptance criteria?

I'll document this as REQ-AUTH-001 with complete functional specifications."
```

### Software Developer Session
```
You: "Implement the login function"

Dev: "I need the approved authentication specification first. Could you provide:
• Path to the requirements document
• Specific requirement ID (e.g., REQ-AUTH-001)
• Current requirement status (should be 'Approved')

Once I have the specification, I'll implement exactly what's documented with proper requirement traceability."
```

### Solution Architect Escalation
```
Dev: "I have conflicting requirements between the API spec and UI mockups"

SA: "I'll resolve this architectural conflict. Let me:
1. Review both specifications
2. Analyze the technical implications
3. Make an architectural decision
4. Update affected specifications
5. Document the resolution for the team

This ensures consistent implementation across all components."
```

## 🏗️ Repository Structure

After installation, your project will have:

```
your-project/
├── .github/
│   ├── copilot-instructions.md          # Main framework configuration
│   ├── copilot-roles/                   # Role-specific instructions
│   │   ├── solution_architect.md        # Technical leadership
│   │   ├── software_architect.md        # System design
│   │   ├── business_analyst.md          # Requirements analysis
│   │   ├── software_developer.md        # Implementation
│   │   ├── qa_engineer.md               # Testing & quality
│   │   ├── devops_engineer.md           # Infrastructure
│   │   └── technical_writer.md          # Documentation
│   └── copilot-tech/                    # Technology-specific instructions
│       └── github.md                    # GitHub-specific guidance
└── [your project files]
```

## 🔧 Package Distribution Architecture

### Clean Separation Design
```
copilot-instructions/
├── .github/                    # Source of truth for all instruction files
├── npm/                       # Complete npm package distribution
│   ├── package.json          # npm configuration
│   ├── bin/setup.js         # Interactive installer
│   └── node_modules/        # Dependencies
├── nuget/                     # Complete .NET Global Tool distribution
│   ├── Avanavo.CopilotInstructions.csproj  # Global tool project
│   ├── Program.cs               # Entry point
│   ├── InstallationLogic.cs     # Installation logic
│   ├── bin/                     # .NET build outputs
│   └── obj/                     # .NET intermediate files
├── scripts/                   # Shared release tooling
└── README.md                  # This documentation
```

### Single Source of Truth
- **npm package**: References `../.github/**/*` (no duplication)
- **NuGet package**: Embeds `../.github/**/*` as resources (no duplication)
- **All methods**: Same files, same behavior, single update location

## 📦 Installation Options

### Option 1: npm (Recommended for JS/TS/Node.js)
```bash
# Interactive installation with options for existing .github directories
npx @avanavo/copilot-instructions

# Provides: Skip, Backup, Merge, Force, Cancel options
# Cross-platform: Windows, macOS, Linux
# Dependencies: Node.js (automatically handled)
```

### Option 2: .NET Global Tool (For .NET/C# Projects)
```bash
# Install globally (one-time setup)
dotnet tool install -g Avanavo.CopilotInstructions

# Use in any project directory
cd your-dotnet-project
avanavo-copilot-setup

# Same interactive experience as npm version
# Cross-platform: Windows, macOS, Linux  
# Dependencies: .NET 8.0+ (automatically handled)
```

## 🔄 Interactive Installation Process

All installation methods provide the same user experience:

### 1. **Fresh Installation** (No existing .github directory)
```
Installing copilot instructions...
✅ Successfully installed copilot instructions to /your/project/.github
```

### 2. **Existing Directory Detected**
```
Directory .github already exists.

What would you like to do?
1. Skip installation (keep existing files)
2. Backup existing and install fresh  
3. Merge with existing files
4. Force overwrite (destructive)
5. Cancel installation

Please choose an option (1-5):
```

### 3. **Backup Option** (Recommended for safety)
```
Creating backup at: .github.backup.20250921-143022
✅ Backup created successfully
✅ Successfully installed copilot instructions to .github
```

### 4. **Merge Option** (Preserve existing customizations)
```
Merging with existing files...
Adding: copilot-instructions.md
Overwriting: copilot-roles/software_developer.md
Adding: copilot-roles/solution_architect.md
✅ Merge completed successfully!
```

## 🚀 Publishing & CI/CD

### Automated Publishing
Both packages are automatically published when you create a GitHub release:

1. **Create release** with version tag (e.g., `v1.0.0`)
2. **GitHub Actions automatically**:
   - Validates both package structures
   - Tests npm and .NET builds
   - Publishes to npm registry: `@avanavo/copilot-instructions`
   - Publishes to NuGet Gallery: `Avanavo.CopilotInstructions`
3. **Version consistency** ensured across both packages

### Validation Pipeline
Every push and PR automatically validates:
- ✅ npm package structure and build
- ✅ .NET Global Tool structure and build  
- ✅ Instruction file completeness
- ✅ Cross-platform compatibility
- ✅ Package creation and installation

## 🌟 Advanced Features

### Requirement Traceability
```javascript
// Implements REQ-AUTH-001: User login validation
// Business Rule BR-PASSWORD-001: Password complexity requirements
function validateUserLogin(email, password) {
    // Implementation with clear requirement links
}
```

### Commit Message Standards
```
feat: implement user password validation (REQ-AUTH-001)

- Add password strength validation per BR-PASSWORD-001
- Minimum 8 chars, mixed case, numbers required  
- Returns clear validation messages for UI
- Unit tests cover all acceptance criteria

Refs: REQ-AUTH-001, BR-PASSWORD-001
```

### Technology-Specific Support
The framework includes specialized instructions for:
- **DevExpress/.NET**: Component architecture, data binding patterns
- **Deno/Supabase**: Function design, database interactions
- **Express.js**: API architecture, middleware patterns
- **GitHub**: Repository management, PR workflows, Actions

## 🛠️ Customization

### Modify Role Instructions
Edit files in `.github/copilot-roles/` to customize role behavior:
```markdown
# .github/copilot-roles/software_developer.md
- Add your coding standards
- Include project-specific patterns  
- Define custom requirement formats
```

### Add Technology Instructions
Create new files in `.github/copilot-tech/`:
```markdown
# .github/copilot-tech/react.md
React-specific development patterns and standards
```

### Configure Role Triggers
Modify `.github/copilot-instructions.md` to customize when roles activate:
```markdown
| **React Developer** | "component", "jsx", "hooks" | React implementation |
```

## 📖 Usage Examples

### Creating a New Feature
```
You: "I need a user profile management system"

Copilot: "This appears to be a Business Analyst task. Should I proceed with Business Analyst instructions?"

You: "Yes"

BA: "I'll create the user profile specification. Let me understand:
1. What profile fields are required?
2. Who can edit profiles?
3. Do you need profile pictures?
4. What validation rules apply?
5. Should I create user stories?"
```

### Implementing Approved Requirements
```
You: "Implement REQ-PROFILE-001 user profile editing"

Copilot: "This appears to be a Software Developer task. Should I proceed with Software Developer instructions?"

You: "Yes"

Dev: "I'll implement the user profile editing functionality. Let me verify:
• REQ-PROFILE-001 status: Approved ✅
• Acceptance criteria: Clear ✅
• I'll implement exactly as specified with proper traceability"
```

## 🤝 Contributing

1. **Fork** this repository
2. **Create requirements** before implementing changes (use Business Analyst role)
3. **Follow role-based development** for all contributions
4. **Test with GitHub Copilot** to ensure role interactions work
5. **Submit PR** with clear requirement references

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **npm Package**: [https://www.npmjs.com/package/@avanavo/copilot-instructions](https://www.npmjs.com/package/@avanavo/copilot-instructions)
- **NuGet Package**: [https://www.nuget.org/packages/Avanavo.CopilotInstructions/](https://www.nuget.org/packages/Avanavo.CopilotInstructions/)
- **GitHub Repository**: [https://github.com/Avanavo/copilot-instructions](https://github.com/Avanavo/copilot-instructions)
- **Issues & Support**: [https://github.com/Avanavo/copilot-instructions/issues](https://github.com/Avanavo/copilot-instructions/issues)

---

**Ready to transform GitHub Copilot into a professional development agent?**

Choose your installation method and start your first role-based conversation today!
```
