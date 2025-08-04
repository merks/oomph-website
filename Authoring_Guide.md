# Authoring Guide

This guide assumes that you have downloaded an Eclipse Installer and have Oomph installed in your IDE.

1. Download and install the Eclipse **Installer** as outlined in [Eclipse Installer](Eclipse_Installer.md).
2. Ensure that the Oomph setup **SDK** is installed in your IDE.
   1. That's likely already the case because all the IDEs come with it pre-installed.
   2. You can install any IDE with Oomph using the installer to install an IDE of your choice as selected on the first installer page.
   3. You can use `Help → Install New Software` to install `Oomph Setup SDK` from [http://download.eclipse.org/oomph/updates/latest](http://download.eclipse.org/oomph/updates/latest).

## Creating a Setup Project Model

### Using the Setup Project Model Wizard

1. Create an empty project in your workspace or select a folder in an existing project.
   You'll create the new `Setup Project Model` in the selected folder.
2. Open the `New...` dialog and select the `Setup Project Model` wizard:
   ![New-wizard.png](images/New-wizard.png)
3. Select one of the provided templates, e.g., Eclipse.org, Github.com, or Simple, and adjust the displayed values:
   ![New-wizard-2.png](images/New-wizard-2.png)
4. Some values are automatically derived from your input to fields _higher up_ in the dialog.
5. Open the `Preview >>>` to understand the impact of changes to the current field.

### Using the Setup Editor

1.  Open the resulting setup file with Oomph's Setup Editor:
    ![Setup-edit.png](images/Setup-edit.png)
2.  Configure the tasks in the Properties view. Note that there are "Expert" properties available.
3.  Add setup tasks to your project and/or to your project streams and configure them, too.
4.  The Outline view displays a _preview_ of the executable model with resolved variables.

### Testing the Setup Model

1. To test/execute your new setup model:
   1. Start the installer and, if necessary, switch to the Advanced Mode via the dialog menu.
   2. Pick any product on page 1 and click the Next button to proceed to page 2.
   3. Drag and drop your .setup file onto one of the top-level catalogs (Eclipse.org or Github.com) in the projects tree. Your project will appear as a subproject of the special <User> project.
   4. Double-click your project to add it to the table at the bottom of the page. There you can select a project stream in the Stream column. Press the Next button to proceed to the Variables page.
   5. Fill in the empty fields and press the Next button to proceed to the Confirmation page.
   6. Click Finish to start the installation process. The installer will first bootstrap a new IDE and then launch it to complete the installation at startup time.
2. Chances are that your first model contains errors.
   Always turn on live validation in the Setup editor to get early feedback.
   If the installation fails early and the new IDE doesn't come up go back to [Using the Setup Editor](#using-the-setup-editor).
   If the IDE comes up but the initial configuration fails continue with step 3.
3. In the new IDE (whether the initial configuration was successful or not) open your model file from the main menu,
   `Navigate → Open Setup → `![Branch.png](images/Branch.png).
   Find the problems and fix them.
   Then start the setup process **from within** this IDE via the main menu,
   `Help → `![Update.png](images/Update.png)`Perform Setup Tasks…`.
   This _manual trigger_ will pop up a confirmation dialog before starting the setup process so that you can review what tasks are scheduled for execution.

### Contributing to a Project Catalog

When you are done authoring your model file (including testing the installation) commit/push it to the Git repository.
You can open an [issue](https://github.com/eclipse-oomph/oomph/issues) to ask for it to be added to one of the existing project catalogs.


## Understanding the Setup Engine

### Understanding Setup Tasks and Scopes

The setup engine collects the **setup tasks** that are needed for a particular installation from a number of places called **scopes**.
Some scopes can be nested and nested scopes generally _inherit_ the tasks of their parent scopes.
A setup is fully described by the following _local entry_ scopes:

* The **Installation** scope is located in eclipse/configuration/org.eclipse.oomph.setup/installation.setup and contains tasks that are specific to this installation.
  In addition (and more importantly) the Installation scope _points_ to exactly one Product Version scope (see below) in order to make all tasks (including inherited tasks) of that product version apply to this installation, too.
* The **Workspace** scope is located in workspace/.metadata/.plugins/org.eclipse.oomph.setup/workspace.setup and contains tasks that are specific to this workspace.
  In addition the Workspace scope can optionally _point_ to a number of Stream scopes (see below) in order to make all tasks (including inherited tasks) of those streams apply to this workspace, too.
* The **User** scope is located in user.home/.eclipse/org.eclipse.oomph.setup/setups/user.setup and contains tasks that are common to **all** installations and workspaces (unless they're restricted to particular installations or workspaces).

The following additional scope types exist, so they can be referenced by the entry scopes:

* The **[Catalog Index](https://github.com/eclipse-oomph/oomph/blob/master/setups/org.eclipse.setup)** is the root scope and contains nested Product Catalogs and Project Catalogs.
* A **[Product Catalog](https://github.com/eclipse-oomph/oomph/blob/master/setups/org.eclipse.products.setup)** contains nested Product scopes and possibly a small number of tasks that are common to all nested scopes.
  Nested products may be contained directly or be linked in from separate files.
* A **[Product](https://github.com/eclipse-oomph/oomph/blob/master/setups/OomphInstaller.setup)** contains nested Product Version scopes and possibly some tasks that are common to all nested scopes.
* A **Product Version** contains no nested scopes but tasks that are specific to that product version.
* A **[Project Catalog](https://github.com/eclipse-oomph/oomph/blob/master/setups/org.eclipse.projects.setup)** contains nested Project scopes and possibly a small number of tasks that are common to all nested scopes.
  Nested projects may be contained directly or be linked in from separate files.
* A **[Project](https://github.com/eclipse-oomph/oomph/blob/master/setups/Oomph.setup)** contains nested Stream and/or (Sub-) Project scopes and typically some tasks that are common to all nested scopes.
* A **Stream** contains no nested scopes but tasks that are specific to that stream.

The resulting list of tasks is then flattened, that is, compound tasks (folders) are recursively replaced by their contained tasks.
Disabled tasks (see the editor's context menu) are removed from the list.
Tasks that are restricted to scopes that are not chosen for the current installation/workspace are also removed.
Tasks that are excluded from the current _trigger_ (one of `Bootstrap`, `Startup` or `Manual`) are also removed.

The remaining list is then partially reordered according to a number of criteria such as task priority (hardcoded),
variable references or explicitly authored task requirements (successors and predecessors in the expert properties).
If no such criteria apply the tasks are kept in their authored order as much as possible.

Some types of tasks allow only one instance in the list of tasks.
For example only one variable task (see below) with a given variable name is allowed to execute.
To specify several of them (with the same name) is perfectly okay, but you should notice that the earlier (according to the established order; see above) tasks are replaced/overridden by the later ones.
This way, for example, a user can always override such tasks from any high/early scope, e.g., the Project or Stream scope, in his local User scope.

Now variable references in all String attributes of the tasks and their child elements are resolved and replaced by their expanded values.
For details see [Declaring and Using Variables](#declaring-and-using-variables) below.

Then the engine calls the `isNeeded()` method on each task in the list and removes those that are not needed (possibly according to the state of the running IDE).

If now the list of needed tasks is not empty a confirmation dialog is displayed and when the user presses `Instal`l the `perform()` method is called on each task.
The progress of the installation process is then displayed in a progress dialog.
The processing can be canceled at any point in time.

### Declaring and Using Variables

Variables play a very important role in the execution process.
While a project model can perfectly work without the declaration or use of variables the model is typically more flexible with them.
A variable must always be declared with a _Variable Task_ somewhere in the model.
It **must have** a name and **can have** a value or a default value.

If a variable is declared without a value a prompt dialog is displayed early in the execution process.
The user can enter the missing variable values, which are then stored as variable tasks in the `User` scope (see above).
These stored variable tasks are restricted to the scope that originally declared the variable.
At execution time these User-scoped variable tasks override the respective variable tasks that you have declared in your project model.

**Important**: Prompted values of variables that are declared with the type PASSWORD are not stored in user.home/.eclipse/org.eclipse.oomph.setup/setups/user.setup but rather in an Equinox Secure Storage node.
The setup framework ensures that they are never shown in the user interface.

You can use variables (refer to them) in any String-typed or URI-typed attribute of your model.
The general syntax is:
```
  ${variable-name}
```

To prevent a variable reference from being expanded (e.g. you actually want to have the value `${var}` and not the value of `var`),
you need to escape the variable syntax with an extra dollar character. So `$${var}` will result in `${var}`.

In addition to the variables that are declared by VariableTasks you can refer to all of the following:

* Attribute values of setup tasks with a defined ID. The reference syntax is `${taskID.attributeName}`.
* [Predefined variables](#predefined-variables) as determined by the setup engine from the user input to the installer (see below).
* [Environment variables](#environment-variables) as returned by `System.getenv()`.
* System properties as returned by `System.getProperties()`.

#### Predefined Variables

The following variables are predefined by the setup engine:

| Name | Value |
| --- | -- |
| **scope.installation.name** | The value of the _name_ attribute of the current installation scope. |
| **scope.installation.label** | The value of the _label_ attribute of the current installation scope. |
| **scope.installation.description** | The value of the _description_ attribute of the current installation scope. |
| **scope.workspace.name** | The value of the _name_ attribute of the current workspace scope. |
| **scope.workspace.label** | The value of the _label_ attribute of the current workspace scope. |
| **scope.workspace.description** | The value of the _description_ attribute of the current workspace scope. |
| **scope.user.name** | The value of the _name_ attribute of the current user scope. |
| **scope.user.label** | The value of the _label_ attribute of the current user scope. |
| **scope.user.description** | The value of the _description_ attribute of the current user scope. |
| **scope.product.catalog.name** | The value of the _name_ attribute of the current product catalog scope. |
| **scope.product.catalog.label** | The value of the _label_ attribute of the current product catalog scope. |
| **scope.product.catalog.description** | The value of the _description_ attribute of the current product catalog scope. |
| **scope.product.name** | The value of the _name_ attribute of the current product scope. |
| **scope.product.name.qualified** | The concatenated value of the _name_ attributes of the current product scope and its parent scopes. |
| **scope.product.label** | The value of the _label_ attribute of the current product scope. |
| **scope.product.description** | The value of the _description_ attribute of the current product scope. |
| **scope.product.version.name** | The value of the _name_ attribute of the current product version scope. |
| **scope.product.version.name.qualified** | The concatenated value of the _name_ attributes of the current product version scope and its parent scopes. |
| **scope.product.version.label** | The value of the _label_ attribute of the current product version scope. |
| **scope.product.version.description** | The value of the _description_ attribute of the current installation scope. |
| **scope.project.catalog.name** | The value of the _name_ attribute of the current project catalog scope. |
| **scope.project.catalog.label** | The value of the _label_ attribute of the current project catalog scope. |
| **scope.project.catalog.description** | The value of the _description_ attribute of the current project catalog scope. |
| **scope.project.name** | The value of the _name_ attribute of the current project scope. |
| **scope.project.name.qualified** | The concatenated value of the _name_ attributes of the current project scope and its parent scopes. |
| **scope.project.label** | The value of the _name_ attribute of the current project scope. |
| **scope.project.description** | The value of the _name_ attribute of the current project scope. |
| **scope.project.stream.name** | The value of the _name_ attribute of the current stream scope. |
| **scope.project.stream.name.qualified** | The concatenated value of the _name_ attributes of the current stream scope and its parent scopes. |
| **scope.project.stream.label** | The value of the _label_ attribute of the current stream scope. |
| **scope.project.stream.description** | The value of the _description_ attribute of the current stream scope. |

#### Variable Extensions

You can also extend variable references that evaluate to file system paths by adding a forward slash notation of the nested path **before** the closing brace.
The advantage is that the full resulting path is formatted in the OS-specific form, e.g.,
```
  ${installation.location/git/myproject} evaluates to C:\\develop\\installation1\\git\\myproject on Windows
```

After the path extension part you can add filter calls with pipe symbols. Filter names are generally case-insensitive. Multiple filters can be chained. Example:
```
  ${installation.location|uri}/git/myproject evaluates to file:/C:/develop/installation1/git/myproject
```

#### Variable Filters

The following filters are currently available:

| Name | Value |
| --- | --- |
| **base64** | Encodes the String value to its base64 representation. |
| **basePath** | Removes the last segment from a file system path. |
| **camel** | Converts a qualified name to camel case notation. |
| **canonical** | Canonicalizes a file system path. |
| **cap** | Capitalizes the first word of a String value. |
| **capAll** | Capitalizes all words of a String value. |
| **cygpath** | Converts a Windows path to a Linux-style path as used for cygwin. |
| **file** | Converts a file: URI to an OS-specific file system path. |
| **fileExtension** | Extracts the file extension from a URI or a file system path. |
| **gitRepository** | Extracts the name of the repository from a Git URI (excluding a possible .git suffix). |
| **lastSegment** | Extracts the last segment from a file system path. |
| **length** | Converts a String to a String that contains the alpha-numerical representation of the length of the original String. |
| **lower** | Converts all characters of a String value to lower-case. |
| **not** | The boolean logical negation, i.e., 'false' if the value is 'true', and 'true' if the value is 'false' (or anything else). |
| **path** | Converts all \ characters of a String value, typically a file system path, to /. |
| **pathEncode** | Converts a file system path to a String value that can be used as a file name. |
| **patternQuote** | Quotes regular-expression constructs in the String value such that the result can be used as a literal string in patterns. |
| **preferenceNode** | Escapes all forward slashes (/) of a String value, so that the result can be used as a value in preference nodes. |
| **property** | Escapes all double back slashes (\\\) of a String value, so that the result can be used as a value in properties. |
| **propertyValue** | Interprets the String value as a preference property path and returns the value of that property. |
| **qualifiedName** | Converts a camel case String value name to a qualified name. |
| **rseFreeze** | The result of org.eclipse.rse.internal.persistence.PropertyFileProvider.freeze(String). |
| **slashDecode** | Decodes a slashEncoded String value. |
| **slashEncode** | Encodes all slashes and backslashes of a String value. |
| **trim** | Removes all whitespace from the beginning and the end of a String. |
| **trimLeft** | Removes all whitespace from the beginning of a String. |
| **trimRight** | Removes all whitespace from the end of a String. |
| **trimTrailingSlashes** | Removes all slashes and backslashes from the end of a String. |
| **upper** | Converts all characters of a String value to upper-case. |
| **uri** | Converts a file system path to a file: URI. |
| **uriLastSegment** | Extracts the last path segment from a hierarchical URI or the authority from an opaque URI. |
| **urlDecode** | Decodes a URL. |
| **urlEncode** | URL-encodes a String value. |
| **username** | Escapes all "at" symbols (@) of a String value, so that the result can be used in URI that contain a username. |

You can also define your own custom variable filters by contributing to the extension point org.eclipse.oomph.setup.core.stringFilters.

#### Variables from Outer Scopes

When looking for declared variables that you can use in your model also have a look at the Outline view that displays variables from the outer scopes.
For example the current [Project Catalog](https://github.com/eclipse-oomph/oomph/blob/master/setups/org.eclipse.projects.setup) file for Eclipse.org projects contains declarations for some useful variables:

* **jre.location-1.8** --\> The folder containing a 1.8 compatible JDK/JRE for architecture `${os.arch}`; one per Java version.
* **github.user.id** --\> The GitHub user ID for Git commits
* **github.author.name** --\> The GitHub author name for Git commits
* **githu.author.email** --\> The GitHub author email for Git commits

The advantage of having these variables be declared in a project-independent scope is that their prompted values will be stored in the `User` scope without a project restriction.
Hence users will not be required to enter these values more than once even when they install additional environments.
Of course they can be edited in the `User` model at any time.

#### Environment Variables

The recommended form of variable names is the dot-separated notation.
Note that it is typically not possible to define environment variables with dots in their name.
If you want to define variables in your process/system environment use underscores instead of the dots; you can still refer to them via dot-notation in your models.

### Conditional Tasks

All setup tasks support filters.
Oomph reuses [p2's implementation](https://eclipse.dev/eclipse/markdown/?file=eclipse-equinox/p2/master/docs/Installable_Units.md#enablement-filter) of LDAP filters.
I.e., it supports a string representation of LDAP Search Filters, [RFC 1960](//tools.ietf.org/html/rfc1960), UMich, 1996, [http://www.ietf.org/rfc/rfc1960.txt](http://www.ietf.org/rfc/rfc1960.txt)

The filter property of a setup task is an advanced property.
To display this property, ensure that `Show Advanced Properties` is enabled in the `Properties` view tool bar.
The properties of a filter expression can generally refer to any system property or any environment variable.
For example, the following filter expression on a task will ensure that it is included only when performing a task on a Linux operating system.
```
 (osgi.os=linux)
```

The latest version of Oomph allows filter properties to refer to the values of variables as defined in the setup itself.
For example, this idiom can be used to express if-then-else.
```
 <?xml version="1.0" encoding="UTF-8"?>
 <xmi:XMI xmi:version="2.0"
     xmlns:xmi="http://www.omg.org/XMI"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns:setup="https://www.eclipse.org/oomph/setup/1.0">
   <setup:VariableTask
       type="BOOLEAN"
       name="example.filter"
       label="Example Filter">
     <description>An example of a variable used to conditionally filter tasks</description>
   </setup:VariableTask>
   <setup:CompoundTask
       filter="(example.filter=true)"
       name="Filter True">
     <setupTask
         xsi:type="setup:VariableTask"
         name="example.variable.a"
         label="Property A">
       <description>The value use for system.property.a</description>
     </setupTask>
     <setupTask
         xsi:type="setup:EclipseIniTask"
         option="-Dsystem.property.a"
         value="=${example.variable.a}"
         vm="true"/>
     <description>Tasks that will be present only when example.filter is true</description>
   </setup:CompoundTask>
   <setup:CompoundTask
       filter="(example.filter=false)"
       name="Filter False">
     <setupTask
         xsi:type="setup:VariableTask"
         name="example.variable.b"
         label="Property B">
       <description>The value used for system.property.b</description>
     </setupTask>
     <setupTask
         xsi:type="setup:EclipseIniTask"
         option="-Dsystem.property.b"
         value="=${example.variable.b}"
         vm="true"/>
     <description>Tasks that will be present only when example.filter is false.</description>
   </setup:CompoundTask>
 </xmi:XMI>
```

On the `Variables` page of the setup wizards, any variable that is used in property of a filter will be displayed in bold.
It is significant to note that the value of a so-called filter variable can conditionally affect the presence of other variables.
In this example, either variable `example.variable.a` or `example.variable.b` (but not both) will be present on the `Variables` page,
depending on the value of the `example.filter` variable,
which is displayed as a checkbox because it is of type `BOOLEAN`.

Note that Oomph setup editors support textual copy and paste, so you can copy the above XML and paste it into your setup editor to try it out.

#### Performing Tasks Just Once

Filters can be used in combination with implicit variable such that tasks will be performed at most once per installation or per workspace using these idioms:
```
 <?xml version="1.0" encoding="UTF-8"?>
 <xmi:XMI xmi:version="2.0"
     xmlns:xmi="http://www.omg.org/XMI"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns:setup="https://www.eclipse.org/oomph/setup/1.0">
   <setup:CompoundTask
       filter="(!(example.installation.filter=true))"
       name="Filter Once Per Installation">
     <setupTask
         xsi:type="setup:PreferenceTask"
         key="/instance/org.eclipse.oomph.setup.ui/showToolBarContributions"
         value="true">
       <description>Some arbitrary tasks to be performed only once per installation.</description>
     </setupTask>
     <setupTask
         xsi:type="setup:PreferenceTask"
         key="/configuration/org.eclipse.oomph.setup.core/variables/example.installation.filter"
         value="true">
       <description>
         Set the configuration variables preference to true
         such that the containing filtered compound task never performs again for the current installation.
       </description>
     </setupTask>
     <description>Tasks that will be present only when example.installation.filter is not true.</description>
   </setup:CompoundTask>
   <setup:CompoundTask
       filter="(!(example.workspace.filter=true))"
       name="Filter Once Per Workspace">
     <setupTask
         xsi:type="setup:PreferenceTask"
         key="/instance/org.eclipse.oomph.setup.ui/showProgressInWizard"
         value="true">
       <description>Some arbitrary tasks to be performed only once per workspace.</description>
     </setupTask>
     <setupTask
         xsi:type="setup:PreferenceTask"
         key="/instance/org.eclipse.oomph.setup.core/variables/example.workspace.filter"
         value="true">
       <description>
         Set the instance variables preference to true
         such that the containing filtered compound task never performs again for the current workspace.
       </description>
     </setupTask>
     <description>Tasks that will be present only when example.instance.filter is not true.</description>
   </setup:CompoundTask>
 </xmi:XMI>
```

## Macros and Macro Expansion Tasks

As of Oomph 1.13, released with Eclipse 2019-06, there is support for Macros.
 A Macro is a Scope, i.e., is a container for setup tasks, and can specify 0 or more Parameters.
 Each Parameter specifies a name, a description, and optionally a default value.
 The parameter names can be used as variable references in the setup tasks contained by the Macro.

### Creating a Macro

The simplest way to create a new Macro is from the context menu of the folder where you want to locate the resource to contain it.
From the context menu, use `New → Other...` and then locate `Oomph → Setup Macro Model` in the wizard.
You can then edit the new Macro with the Setup Editor.
You can create Parameters, if desired, and of course you can create any other setup tasks.

Here is an example of how one could use a Macro for creating a Git Clone task:
```
 <?xml version="1.0" encoding="UTF-8"?>
 <setup:Macro
     xmi:version="2.0"
     xmlns:xmi="http://www.omg.org/XMI"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns:git="https://www.eclipse.org/oomph/setup/git/1.0"
     xmlns:setup="https://www.eclipse.org/oomph/setup/1.0"
     label="Git Clone">
   <setupTask
       xsi:type="git:GitCloneTask"
       id="git.clone"
       remoteName="${remoteName}"
       remoteURI="${remoteURI}"
       pushURI="${pushURI}"
       checkoutBranch="${checkoutBranch}">
     <annotation
         source="https://www.eclipse.org/oomph/setup/FeatureSubstitution">
       <detail
           key="restrictToCheckoutBranch">
         <value>${restrictToCheckoutBranch}</value>
       </detail>
       <detail
           key="recursive">
         <value>${recursive}</value>
       </detail>
     </annotation>
     <description>${description}</description>
   </setupTask>
   <description>The GitClone macro provides a template for creating a clone task</description>
   <parameter
       name="description">
     <description>The description of the Git clone task</description>
   </parameter>
   <parameter
       name="pushURI">
     <description>The push URI of the Git clone task</description>
   </parameter>
   <parameter
       name="recursive"
       defaultValue="false">
     <description>Whether submodules should be recursively cloned</description>
   </parameter>
   <parameter
       name="remoteName"
       defaultValue="origin">
     <description>The name of the remote</description>
   </parameter>
   <parameter
       name="remoteURI">
     <description>The remote URI of the Git clone task</description>
   </parameter>
   <parameter
       name="restrictToCheckoutBranch"
       defaultValue="false">
     <description>Whether the clone should be restricted to clone only the checkout branch</description>
   </parameter>
   <parameter
       name="checkoutBranch">
     <description>The name of the branch that the Git clone task to checks out</description>
   </parameter>
 </setup:Macro>
```

Special support is provided for defining so called local Variables in a Macro.
Any Variable with a name that starts with `*` will be handled in a special way during [Macro Expansion](#macro-expansion-processing).

### Using a Macro with a Macro Expansion Task

To use a Macro you must create a Macro Expansion task.
The easiest way to do this is to drag the resource containing the Macro and then drop it into the Setup Editor where you want to use it.
Similarly, if you want to use a Macro defined in the internet, you can use Load Resource... from the Setup Editor's context menu to load the Macro into the editor's resource set (or drag the link and drop it into the editor).
Note that Macros available in the resource set are always shown in the Outline view.
Once the Macro is available in the editor's resource set, or in the Outline, you can drag and drop the Macro anywhere that any other setup task can be created.
This will create a Macro Expansion task that binds to the Macro.

A Macro Expansion task must specify an ID, which of course must be unique within the containing resource.
The ID is used during [Macro Expansion Processing](#macro-expansion-processing).
Via drag and drop, an ID is automatically assigned, but you'll likely want to change it.
A Macro Expansion task can supply Arguments to bind the values of the Parameters of the Macro.
For every Parameter without a default value there must be a corresponding Argument to bind its value.
The validator will complain when that's not the case, so be sure to enable Live Validation via the context menu.
When creating a Macro Expansion task using drag and drop, the required Arguments are automatically created.
Of course you'll want to change the generated values; you can delete any Arguments for which the Parameter specifies the default value that you wish to just use.
You can change the Argument's value by double clicking the Argument to ensure that it's visible in the Properties view, and can then edit the Value property of the Argument there.
The description of the corresponding Parameter is displayed in the Properties view after the Parameter's name.
This is why it's important to include a description for each Parameter so that the author using the Macro knows how the Argument's value will be used by that Macro.

The setup editor displays the Macro referenced by a Macro Expansion task as a child item, in light brown, in the tree view, so you can fully explore the Macro being used.
In addition a Preview item is displayed, in light blue, to show how the Macro Expansion task will be expanded.
And of course the Outline view allows you to preview all of the tasks that will be performed when you run the installer later.

Here is an example of how the above Macro could be used by a Macro Expansion task:
```
 <?xml version="1.0" encoding="UTF-8"?>
 <setup:Project
     xmi:version="2.0"
     xmlns:xmi="http://www.omg.org/XMI"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns:setup="https://www.eclipse.org/oomph/setup/1.0"
     name="sample.project"
     label="SampleProject">
   <setupTask
       xsi:type="setup:MacroTask"
       id="my"
       macro="GitCloneMacro.setup#/">
     <argument
         name="description"
         value="description_value"/>
     <argument
         name="pushURI"
         value="pushURI_value"/>
     <argument
         name="recursive"/>
     <argument
         name="remoteName"/>
     <argument
         name="remoteURI"
         value="remoteURI_value"/>
     <argument
         name="restrictToCheckoutBranch"/>
     <argument
         name="checkoutBranch"
         value="master"/>
   </setupTask>
   <stream name="stream"/>
   <logicalProjectContainer
       xsi:type="setup:ProjectCatalog"
       href="index:/org.eclipse.setup#//@projectCatalogs\[name='org.eclipse'\]"/>
   <description>SampleProject provides cool stuff.</description>
 </setup:Project>
```

Note that here we have several Arguments without a value.
Those could be deleted or a value (presumably different from the default value of the Parameter) could be specified.
Also note that a well-formed Argument can only bind to a Parameter of the containing Macro Expansion task's Macro, so the serialization is simplified to specify just the name of the bound Parameter in this case.

### Macro Expansion Processing

A Macro Expansion task is expanded to a Compound Setup Task as illustrated by the Preview item.
Each Argument is bound to its corresponding Parameter via a local variable of the form `*<macro-expansion-task-id>.<parameter-name>`.
Every variable reference to the Parameter name is transformed to use this Variable's more-qualified name instead.
Every setup task with an ID is transformed to specify instead a qualified ID of the form `<macro-expansion-task-id>.<original-id>`
and every variable reference that's prefixed by '<original-id>.' will be transformed to use the more-qualified prefix instead.
In addition, any Variable contained by the Macro with a name that start with '*' will also be changed to use the name `*<macro-extension-task-id>.<original-name>`
and all references to `<original-name>` will be transformed to use that qualified name instead.
This qualification process ensures that unique Variable names are provided by the Macro Expansion because in the end, there's no such thing as a local Variable.

Of course Macros themselves can use Macro Expansion tasks, so the process of expansion is recursive.
That being said, it's of course invalid for this to lead to a cycle.
Cycles are detected by the validator and the expansion process prevents further expansion when a cycle is encountered.

Note that from the context menu of a Macro Expansion task it's possible to invoke "Inline" to replace a Macro Expansion task with its fully expanded equivalent.

## Automation and Specialization with Configurations

A Configuration is not a Scope (is not a container for setup tasks) but rather a container for an Installation and a Workspace; each is optional, but a Configuration with neither is in effect useless.
The Installation and Workspace of a Configuration are effectively used as a template to initialize the Installation and Workspace created by the Eclipse Installer,
i.e., the setup resources that you can open with `Navigate → Open Setup → Installation` and `Navigate → Open Setup → Workspace` in your IDE.
So you can specialize the installation with additional installation-specific tasks,
e.g., a p2 task to install additional features,
and you can specialize the workspace with workspace-specific tasks,
e.g., a variable task to specify the value of a variable so you won't be prompted for that value.

Configurations are not only useful for specifying installation-specific and workspace-specific tasks but also for automating the selection process in the setup wizards, including the installer.
The Configuration's Installation can reference a specific Product Version and the Configuration's Workspace can optionally reference several specific Project Streams.
Both the simple mode and the advanced mode of the installer support dragging and dropping a Configuration to the title area.
You can drag to the title area either a file
(i.e., a file from the file system or from an Eclipse IDE),
a URL (i.e., a link from a browser),
or a copy of a Configuration's XMI serialization.
This will **apply** the Configuration to the wizard with the effect that the Installation's Product Version is selected in the wizard and the wizard advances to the next page.
Similarly, the Workspace's Project Streams are selected in the wizard and the wizard advances to the next page.
If you apply a Configuration with a Workspace to the simple mode of the installer,
you will be prompted to switch to advanced mode because only the advanced mode supports Project selection.
So in simple mode, applying a Configuration advances to the final page,
and in advanced mode, applying a Configuration with an Installation and a Workspace advances to the Variables page.

As an alternative to drag and drop support, rather than dragging a file, link, or XMI serialization, you can copy it to the clipboard and apply the clipboard contents to the wizard.
In simple mode this is done via the Apply Configuration menu item.
In advanced mode this is done via the Apply Configuration toolbar button on the Product or Project page;
the menu item or toolbar item is visible only if the clipboard contains applicable content.

The installer application supports command line arguments so you could also specify a Configuration's file path or URL link on the command line to apply it automatically.

### Creating a Configuration

The simplest way to create a new Configuration is from the context menu of the folder where want to locate the resource to contain it.
From the context menu, use `New → Other...` and then locate `Oomph → Setup Configuration Model` in the wizard.
You can then edit the new Configuration with the Setup Editor.
You can delete the Installation or Workspace if you don't need that aspect.
You can use the Properties view to set the Installation's Product Version or the Workspace's Project Streams.
And of course you can create any other setup tasks in either Scope.

### Configuration Handling

The specific form of the serialized URLs that are used to reference a Product Version or a Project Stream are **very important** to correct behavior.
Relative URLs in the serialization can only work relative to the location of the Configuration's resource, so will only work when you drag and drop a file or link
because a dragging and dropping textual copy of the serialization provides no information about how to resolve relative references.
This is not to say there is anything wrong with relative references, just be aware that they imply that the user must apply the overall file or link, not just the textual serialization.

Another very useful aspect of Configurations is that the wizards handle of the references intelligently.
I.e., if a Installation references a Product Version that's not in any Product Catalog in the Index,
the Product will automatically be added to the user-extensible Product Catalog.
If the Installation references a Product Version via its containing Product Catalog and that Product Catalog is not in the Index,
and the redirectable Product Catalog is not already redirected,
it will be redirected to the referenced Product Catalog
and an appropriate Eclipse Ini redirection tasks will be synthesized so that the installation produced by the installer will be able to resolve the Product Version reference in its Installation via the correct containing Product Catalog.
Analogous processing is done for the Project Stream references with the additional processing of Project's a logical Project container which determines which Project Catalog's extensible Project container is used.
In other words, Configurations can also be used to automate the addition of Products and Projects to the user extensible catalogs.

### Linking to the Configuration

To make your configuration more discoverable
and to make your configuration URI directly usable in the installer and the IDE,
you should reference it from your Project setup (or from something that is in the Catalog Index).
For this purpose, follow these steps:

* Open the Project setup in the Setup Editor.
* Use `Load Resource...` from the context menu and locate the Configuration in your workspace,
  if that's where you're authoring it in the same workspace project as the Project setup,
  or paste the absolute URI of your Configuration (which will not work if your configuration is hosted by git.eclipse.org and is not already linked into the catalog by these steps).
  Alternatively drag the Configuration resource and drop it into the Project's Setup Editor.
* Use `New → Annotation` (last menu item) from the context menu of the Project object.
* Double click the annotation to open the Properties view.
* Set the "Source" property to "ConfigurationReference"; this is not essential but helps identify the purpose of this annotation.
* Use the cell editor for the "References" property to locate your Configuration;
  the list is huge so you need to know the "Label" of your Configuration to find/filter it.
  Much easier is to link-drag (Alt-modifier on Windows) the Configuration object (not the resource) onto the Annotation object.
  Make sure you don't copy it with drag and drop!
  If it shows up as a nested object under the annotation then you have a copy and should undo or delete and try again.
* Save the result.
* Use Open in Text Editor from the context menu and ensure that the result looks like this where the href is a relative path within your workspace project or the absolute URI on the internet.
```
<annotation
    source="ConfigurationReference">
  <reference
      href="configurations/MyConfiguration.setup#/"/>
</annotation>
```

The job that composes the Oomph catalog index will then compose your Configuration into the setups.zip.
It will also generate SVGs you can use use for links to your Configuration.x
These will be available [here](https://download.eclipse.org/oomph/www/setups/svg/).
The name/label is computed from the project name(s).
But you can use an annotation like the following on the Configuration object to specify the badge label explicitly how you want it:
```
<annotation
    source="https://www.eclipse.org/oomph/setup/BrandingInfo">
  <detail
      key="imageURI">
    <value>https://www.eclipse.org/downloads/images/committers.png</value>
  </detail>
  <detail
      key="badgeLabel">
    <value>**Platform SDK**</value>
  </detail>
</annotation>
```

Oomph also provides a reusable page in which to host your configuration,
```
https://www.eclipse.org/setups/installer/?url=<Absolute-URI-of-Configuration>&show=true
```

This page will show your Configuration's description,
if you've linked it into the catalog as described above,
and includes instructions describing the alternative ways of using the Configuration to create an installation and workspace exactly the way you've specified.

On any markdown page, the markdown snippet below can be used to specify a nicely formatted button like this one:

![CREATE DEVELOPMENT ENVIRONMENT PROJECT.png](images/CREATE_DEVELOPMENT_ENVIRONMENT_PROJECT.png)

with a link that can be dragged onto the installer or can used to open the page describing the configuration and how to how the use it:

```
[![Create Eclipse Development Environment for Oomph](https://download.eclipse.org/oomph/www/setups/svg/oomph.svg)](https://www.eclipse.org/setups/installer/?url=https://raw.githubusercontent.com/eclipse-oomph/oomph/master/setups/configurations/OomphConfiguration.setup&show=true "Click to open Eclipse-Installer Auto Launch or drag onto your running installer's title area")
```
Or as HTML like this:
```
<a href="https://www.eclipse.org/setups/installer/?url=https://raw.githubusercontent.com/eclipse-oomph/oomph/master/setups/configurations/OomphConfiguration.setup&show=true" target="oomph_setup" style="margin-left: 2em; margin-top: 1ex; margin-bottom: 1ex; font-weight: bold; padding: 0.25ex 0.25em; text-align: center; text-decoration: none; display: inline-block;">
  <img src="https://download.eclipse.org/oomph/www/setups/svg/oomph.svg" alt="Create Oomph Development Environment..."/></a>
```

Have a look at [Oomph's build site](https://ci.eclipse.org/oomph/) or at [m2e README.md](https://github.com/eclipse-m2e/m2e-core/blob/main/README.md#%EF%B8%8F-contributing) to see how this looks.

## Tips and Tricks

### Getting Early Feedback

Why didn't the model editor tell me earlier that I've made a silly mistake?
Please enable Live Validation in the editor menu to get early feedback.
Also make use of the Outline view because it provides a preview of the tasks that will be executable and will diagnose problems such as undeclared variables,
e.g., using ${foo.bar} but not having a corresponding variable declaration for foo.bar.

### Testing a Setup in a Clean Environment

Over time, many or most of your prompted variables will be saved in the user.setup.
To test your setup in an environment that simulates what a brand new user will experience, you can launch the installer as follows:
```
  <eclipse-inst-executable> -vmargs -Duser.home=<absolute-user-home-folder> -Doomph.setup.user.home.redirect=true
```

This also works for the self-extracting native Windows executable as well as for the eclipse-inst executable in extracted Eclipse Installer's folder.
The value `<absolute-user-home-folder>` of the system property `user.home` should be an absolute path what will become the user home folder;
it will be created if it doesn't exist.
The value `true` of the system property `oomph.setup.user.home.redirect` will direct the installer to include the `-Duser.home=<absolute-user-home-folder>` argument
in the `eclipse.ini` of the created installation so that it too behaves as if that folder were its user home folder.

In this fashion you can test in a clean environment and you can discard `<absolute-user-home-folder>` without impacting your real environment.

### Copying Tasks and Other Elements

The Setup Editor supports the export and import of any model elements by using copy to or paste from the clipboard.
The clipboard will/must contain a valid XML document.
With this method, for example, you can easily copy task snippets from your model directly into a forum post when you ask for help (or into a Skype window when you chat with your colleagues).
Or you can easily paste such XML snippets from discussion replies directly into your Setup Editor.

You have access to many example setups from within your IDE!
Use `Navigate → Open Setup → Parent Models → Open Catalog Index` to investigate everything within the index.
The context menu provides a way to open elements in a text editor.
This is particularly handy for finding out where a particular setup is hosted (hrefs are resolved in the Setup editor);
one use case is checking and repairing links to project setups added to your user projects.

### Hosting Your Own Index or Catalog

If you want to host your own product or project catalog,
you must provide a URI mapping to the installer to locate the root setup file (the "index").
Open the `eclipse.ini` file and add an `oomph.redirection.<some_id>` where `some_id` is any unique identifier.
The root EMF model is an Index and must be stored in the file `org.eclipse.setup`.
Use [https://github.com/eclipse-oomph/oomph/blob/master/setups/org.eclipse.setup](https://github.com/eclipse-oomph/oomph/blob/master/setups/org.eclipse.setup) as a starting point,
or use the wizard to create it.
All of your other setup models can be stored in any file name you desire.
You must also copy all of the model files in [https://github.com/eclipse-oomph/oomph/tree/master/setups/models/](https://github.com/eclipse-oomph/oomph/tree/master/setups/models/) to your redirection `<path>/models/`.
You can redirect to your own index with this redirection system property:
```
-Doomph.redirection.setups=https://raw.githubusercontent.com/eclipse-oomph/oomph/refs/heads/master/setups/->http2://<hostname>/<path>/
```

The source URI may be abbreviated to `index:/` and the target URI may also be a file URI, e.g., on a shared file server.

In general it will be highly desirable to archive your setup we do with [SetupArchiver.java](https://github.com/eclipse-oomph/oomph/blob/master/plugins/org.eclipse.oomph.setup.core/src/org/eclipse/oomph/setup/internal/core/SetupArchiver.java)
as used by [SetupArchiver.jenkinsfile](https://github.com/eclipse-oomph/oomph/blob/master/releng/org.eclipse.oomph.releng/hudson/SetupArchiver.jenkinsfile).
The installer and other setup wizards support dragging and dropping an index or archived index onto the title area of the dialog.

The Oomph index has empty redirectable catalogs for products `redirectable.products.setup` and projects `redirectable.projects.setup`.
These allow providing your own catalogs without replacing the entire index or disabling the catalogs shipped with Oomph (by redirecting them).
The following steps are necessary to make use of those setups.

* Create your own project catalog setup file using the wizard.
  Project setups in the project catalog should typically be referenced using absolute URIs, otherwise redirection can become problematic.
  However, if the relative references are downward pointing to some uniquely named folder different from any of the file/folder names in the Eclipse.org index,
  i.e., no `..` traversal to the parent folder is involved and some folder name `<my-projects-folder>`,
  then they will be resolved to absolute URIs of the form `index:/<my-projects-folder>/<path>` which can be handled as described below.
* Add a redirection system property similar to that described above to the `eclipse.ini` file, e.g., `-Doomph.redirection.myProjectCatalog=index:/redirectable.projects.setup->...`.
* If the projects in that catalog are referenced by relative downward references with a unique folder,
  also add a folder redirection system property, e.g.,`-Doomph.redirection.myProjectCatalog=index:/<my-projects-folder>/->.../`,
  to redirect the locations of the referenced projects to the folder where they are physically hosted.
* Your catalog setup file must contain an Eclipse Ini task creating the same redirection(s)!
  Otherwise your catalog (or the referenced projects) will not be visible in the Eclipse created by the installer and hence the projects selected from it cannot be provisioned.
* The first time, you may have to enable your new catalog by selecting it in the folders icon of the drop-down in the upper right hand corner of the wizard's Projects page, otherwise it will be invisible.

To debug the processing of `-Doomph.redirection.*` if needed, set a breakpoint in `org.eclipse.oomph.setup.internal.core.util.SetupCoreUtil.configureResourceSet(ResourceSet)`
within `if (((String)key).startsWith(SetupProperties.PROP_REDIRECTION_BASE))`.

### Shipping Your Own Index

If you want to include your own product or project catalog,
you may ship the root setup file (the "index") relative to the installer directory.
Then you can redirect the index as explained in [Hosting Your Own Index or Catalogs](#hosting-your-own-index-or-catalog).
For example, you can place all setup files in an eclipse-installer/setups/ folder and then redirect access to it with a relative target URI:
```
-Doomph.redirection.setups=https://raw.githubusercontent.com/eclipse-oomph/oomph/refs/heads/master/setups/->setups/
```

Note that shipping the index rather than maintaining it in a central location (accessible to all parties interested) has the following disadvantage:
As each user has her own copy of the index, updates in the setup files will not be distributed automatically.

### Accessing Setups that Require Authentication

If basic authentication is used to access a setup,
Oomph will generally prompt for the credentials and offer to store it in secure storage for future reuse,
but only if the host responds with authorization request.
Some hosts do not do so for security reasons,
i.e., to hide the fact that anything exists at the specified URI.
In that case you will need to specify the URI in such a way that directs Oomph to use basic authentication:
```
https://example.org/owner/repo/raw/master/path/Example.setup?oomph_basic_auth=true
```
<!--
If form-based authentication is required,
you will need to specify the URI to access the setup in such a way that it directs Oomph to the appropriate login/sign-in form in order to acquire the necessary cookies for an authenticated session.

 [https://gitlab-example.com/project/raw/branch/repo-path/Example.setup?oomph\_form=b%27users/sign\_in%27#/](https://gitlab-example.com/project/raw/branch/repo-path/Example.setup?oomph_form=b%27users/sign_in%27#/)
 [https://github.com/ower/repo/raw/master/path/Example.setup?oomph_form=b'login'#/](https://github.com/ower/repo/raw/master/path/Example.setup?oomph_form=b'login'#/)

In this case too, Oomph will then prompt for the credentials and post them to the form.

I show the %27 as an alternative to ' because if you provide the link to the setup via a web page, the process of copying the link might convert to that form, even if you've used ' rather than the equivalent %27 encoding of it.

You can "debug" how this works using org.eclipse.oomph.setup.internal.core.util.ECFURIHandlerImpl.Main.main(String\[\]) in the org.eclipse.oomph.setup.core bundle. Currently around [here](https://git.eclipse.org/c/oomph/org.eclipse.oomph.git/tree/plugins/org.eclipse.oomph.setup.core/src/org/eclipse/oomph/setup/internal/core/util/ECFURIHandlerImpl.java#n2124).
-->

### Generating PDE Target Definition Files

Oomph's [Targlets](Targlets.md) can automagically generate a `*.target` file compatible with the PDE target definition file format for you from your *.setup model.
This is particularly useful if used in combination with Tycho's support for them,
see [https://tycho.eclipseprojects.io/doc/latest/TargetPlatform.html](https://tycho.eclipseprojects.io/doc/latest/TargetPlatform.html),
as it allows you to maintain p2 Repositories and Requirements in one single place, and have that be used both for workspace setup and for Tycho builds.

To generate a `*.target` file, use annotation _TargetDefinitionGenerator_.
An example can be found in Oomph's own [setup model](https://github.com/eclipse-oomph/oomph/blob/1030158fdce259b5b034b60d69561d8c3825e504/setups/Oomph.setup#L528-L570)), like so:
```
<annotation
    source="http:/www.eclipse.org/oomph/targlets/TargetDefinitionGenerator">
  <detail
      key="location">
    <value>${git.clone.location}/targetdefinition/DesignStudio.target</value>
  </detail>
  <detail
      key="extraUnits">
    <value>org.eclipse.equinox.executable.feature.group</value>
  </detail>
  <detail
      key="includeAllPlatforms">
    <value>false</value>
  </detail>
  <detail
      key="includeSource">
    <value>true</value>
  </detail>
  <detail
      key="generateVersions">
    <value>true</value>
  </detail>
</annotation>
```

Note that the `*.target` file will be updated (or initially generated if first time) each time that Oomph Performs Setup Tasks (and not every time you only "touch" your `*.setup` model).
Any errors encountered while generating the `*.target` file are reported in the Setup Log as usual.

Some useful keys to consider for this annotation:

* name : String := the name of the generated Target Platform as it appears in `Window → Preferences → Plug-in Development → Target Platforms`
* location : String := the full location of the generated Target Platform file, e.g. `${git.repository.location/}${scope.project.name}.target`.
* preferredRepositories : TODO
* generateImplicitUnits : Boolean := whether the generated target platform is exhaustive or not. Recommended when using Tycho because Tycho sometimes cannot retrieve all dependencies in cases where p2 can.
* minimizeImplicitUnits : Boolean := TODO
* generateVersions : Boolean/Pattern := A pattern (true > ".*" / false > """) to match IU IDs for which to generate generate an IU version in the .target file. It can fix some issues where an IU requires a version that is not the most recent version available in the repositories.
* includeAllPlatforms : Boolean := flag includeAllPlatforms in the generated target file.
* includeConfigurePhase : Boolean := flag includeConfigurePhase in the generated target file.
* includeMode : String := Either "planner" or "slicer". Corresponds to "includeMode" in the generated target file.
* includeSource : Boolean := flag includeSource in the generated target file.
* extraUnits : TODO
* singleLocation : TODO
* sortLocations : TODO
* generateServerXML : TODO

The annotation itself may be annotated with Annotation `RepositoryIDs`	where keys are repository locations and values are the IDs to assign to them in the generated `*.target` file.

_TODO Document what preferredRepositories, PomModulesUpdater & PomArtifactUpdater do..._

### Setting up WST Server Runtime and Instances

#### Server Runtime Preference

1. Use an Oomphed installation/workspace with preference recorder enabled.
2. Open your project and user setup editors.
3. Go to Preferences / Server / Runtime Environments and 'Add' it as usual.
4. Drag the selected '/instance/org.eclipse.wst.server.core/runtimes' from user to project setup.

Note: It's unclear if the above actually works. Please see thread [https://www.eclipse.org/forums/index.php/t/1086488/](https://www.eclipse.org/forums/index.php/t/1086488/) in forum for details.
For some servers there are extension tasks to handle configuration, see below.

#### Server Instance in Servers View

Requires server runtime to be setup first.

1. Open Servers View and create New server instance and deploy webapps as usual
2. Optionally open server instance editor and adapt configuration as usual.
3. Close Eclipse.
4. Start it again.
5. Open '.plugins/org.eclipse.wst.server.core/servers.xml' from your workspace/.metadata using a UTF capable editor
6. Add Resource Creation Task to your setup:
   ```
   <?xml version="1.0" encoding="UTF-8"?>
   <setup:ResourceCreationTask
       xmi:version="2.0"
       xmlns:xmi="http://www.omg.org/XMI"
       xmlns:setup="https://www.eclipse.org/oomph/setup/1.0"
       content="PUT_CONTENT_FROM_SERVERS_XML_INTO_HERE_USING_A_UTF_CAPABLE_EDITOR_AND_OOMPH_DIALOG"
       targetURL="${workspace.location|uri}/.metadata/.plugins/org.eclipse.wst.server.core/servers.xml"
       encoding="UTF-8">
     <description>tomcat server integration</description>
   </setup:ResourceCreationTask>
   ```
7. Use the resource task content dialog to put the servers xml content into the task.
8. Copy "Servers" project from this workspace into a suitable location of your branch checkout and add/commit/push.
9. Setup project import task that can pick the Servers project up from that committed location.

That's it.
If you want to share it among fellows, be sure to agree on canonical paths for your server installations.

#### Extension Tasks for Specific Servers

For some servers there are Oomph extension tasks that can be used to handle the configuration:

[https://github.com/gratex/oomph-task-server](https://github.com/gratex/oomph-task-server) \- Tomcat, WebLogic, and WebSphere

### Suppress Initial Default Workspace Prompt

Adjust the `SHOW_WORKSPACE_SELECTION_DIALOG` property to `false` via configuration settings org.eclipse.ui.ide.prefs ...
```
<?xml version="1.0" encoding="UTF-8"?>
<setup:ResourceCreationTask
    xmi:version="2.0"
    xmlns:xmi="http://www.omg.org/XMI"
    xmlns:setup="https://www.eclipse.org/oomph/setup/1.0"
    excludedTriggers="STARTUP MANUAL"
    content="MAX_RECENT_WORKSPACES=5&#xD;&#xA;RECENT_WORKSPACES=${workspace.location|property}&#xD;&#xA;RECENT_WORKSPACES_PROTOCOL=3&#xD;&#xA;SHOW_WORKSPACE_SELECTION_DIALOG=false&#xD;&#xA;eclipse.preferences.version=1"
    targetURL="configuration:/.settings/org.eclipse.ui.ide.prefs"
    encoding="UTF-8"/>
```

### Open Initial Default Perspective

Examples below using Perspective ID for Java perspective.

Tell Eclipse which perspective to open initially, by adding option to eclipse ini:
```
<?xml version="1.0" encoding="UTF-8"?>
<setup:EclipseIniTask
    xmi:version="2.0"
    xmlns:xmi="http://www.omg.org/XMI"
    xmlns:setup="https://www.eclipse.org/oomph/setup/1.0"
    excludedTriggers="STARTUP"
    option="-perspective"
    value="org.eclipse.jdt.ui.JavaPerspective"/>
```

Setting a perspective to be default, by adding preference task:
```
<?xml version="1.0" encoding="UTF-8"?>
<setup:PreferenceTask
    xmi:version="2.0"
    xmlns:xmi="http://www.omg.org/XMI"
    xmlns:setup="https://www.eclipse.org/oomph/setup/1.0"
    key="/instance/org.eclipse.ui/defaultPerspectiveId"
    value="org.eclipse.jdt.ui.JavaPerspective"/>
```

### Switch the Current Stream

If you would like to switch the current stream(s),
you can reuse Oomph's initial "Eclipse Importer" wizard,
available as `Import Projects...`
in the drop-down of the `Perform Setup Tasks` reload action in the Oomph toolbar,
or via the menu `File → Import → Oomph > Projects into Workspace`.

Note that it is currently not yet possible to remove the "current" project stream.
As a workaround, use menu `Navigate → Open Setup → Open Workspace` (or if visible click the 'blue guy' icon in the Oomph toolbar) to `Open Workspace` workspace.setup,
expand the first node,
click on the Workspace entry,
open Properties view (with double-click),
and change the last property named "Streams" and remove the current stream.


### Install Eclipse Plug-ins Automatically

Oomph can install Eclipse plugins which you require.
This follow works for normal Projects setup models,
not just for Eclipse plug-in OSGi development,
and is handy to install commonly used 3rd-party Eclipse plug-ins which are not all available from eclipse.org p2 sites.
1. Add a p2 Director child task to your `*.setup`, if it doesn't already have one.
2. Add a repository child in your p2 Director task.
3. In the Properties of the Repository set the URL to a valid p2 repo, e.g. [http://update.eclemma.org](http://update.eclemma.org).
4. Right-click that Repository and choose `Explore`, to open the `Repository Explorer` view
5. In the `Repository Explorer` view change to [X] Compatible and (*) Minor at the lower-right hand corner.
6. Drag & drop the version from the `Repository Explorer` view into the `p2 Director` task of your `*.setup` editor, to create a Requirement child.
   Copy & paste also works.
7. Alternatively, manually create a new child Requirement inside the p2 Director task
8. In the `Repository Explorer` view use the brown (C) icon to switch to `Expert Mode` to see IDs instead of names.
9. Find the ID of the feature IU, it's the one with a PDE feature + folder kind of icon, often ending in `.feature.group`.
10. In the Properties of the Requirement, type the Name to the ID found above, e.g., `com.mountainminds.eclemma.feature.feature.group`.
11. In the Properties of the Requirement, Type should have automatically switched to Feature


<!--
### Create an M2E lifecycle-mapping-metadata.xml

Read [https://eclipse.dev/m2e/documentation/m2e-execution-not-covered.html](https://eclipse.dev/m2e/documentation/m2e-execution-not-covered.html).

Use the following to avoid littering your pom.xml with org.eclipse.m2e:lifecycle-mapping:
```
<setupTask
     xsi:type="setup:PreferenceTask"
     key="/instance/org.eclipse.m2e.core/eclipse.m2.WorkspacelifecycleMappingsLocation"
     value="${workspace.location}/.metadata/.plugins/org.eclipse.m2e.core/lifecycle-mapping-metadata.xml"/>
<setupTask
   xsi:type="setup:ResourceCreationTask"
   content="..."
   targetURL="${workspace.location|uri}/.metadata/.plugins/org.eclipse.m2e.core/lifecycle-mapping-metadata.xml"
   encoding="UTF-8">
  <description>Initialize M2E's Maven Lifecycle Mappings, see https://eclipse.dev/m2e/documentation/m2e-execution-not-covered.html</description>
 </setupTask>
```

For "content" just open the popup using the `[...]` icon in the Properties and copy/paste the content from menu Window > Preferences > Maven > Lifecycle Mappings: Open workspace lifecycle mappings metadata. (This is easier than editing the content=".." in source view, because it will correctly do the XML escaping for you.)

Now whenever M2E whines about stuff like "Plugin execution not covered by lifecycle configuration: org.apache.maven.plugins:maven-dependency-plugin:2.10:unpack (execution: unpack-license, phase: generate-resources)" etc. just use the Quick Fix in the Problems view and choose the option to use workspace preferences (instead of letting the quick fix modify your pom.xml to add org.eclipse.m2e:lifecycle-mapping <lifecycleMappingMetadata>).
-->

### Find an Eclipse p2 Repository with the Repository Explorer

Most projects don't document the locations of all their p2 update sites very well.
This makes it hard to find the URL you need in order to install something or in order to specify a URL for your target platform definition.
Oomph indexes all the p2 update sites available at download.eclipse.org to make this job easier.
You can make use of this as follows:

1. In the Quick Access control, type `Repository Explorer` to show Oomph's `Repository Explorer` view.
2. In that view's toolbar, locate the tool item with the hover `Search Eclipse repositories by provided capabilities`, i.e., the one that looks like a little search flashlight, and click it.
3. This brings up the `Eclipse Repository Search` dialog.
   The index is very large so it takes a while to load it.
   But it's cached locally and updated on the server once per day.
4. At the root of the displayed tree are p2's namespaces and under each of these are the capabilities in that namespace.
   They're organized hierarchically by their qualified name.
   It's all quite technical and the tree is very large.
   So while you can explore it, you'll most likely want to use the filter to find something quickly.
5. Type the fully qualified name of a Java package or installable unit you wish to locate into the filter.
   Note that tree items for which there exist a concrete version in some repository are decorated as such.
   Keep in mind that many projects don't version their Java packages, so it's often better to look at the `org.eclipse.equinox.p2.iu category`.
   Here's what it looks like searching for "org.eclipse.emf.ecore.xcore":
   ![SearchEclipseRepositoryDialog.png](images/SearchEclipseRepositoryDialog.png)
6. You can select a capability in the tree so that the lower panel displays all the versions of the capability that are available.
   Under each of those are nested the update sites that contain them.
   Composite update sites show their children hierarchically.
7. Of course you can double click a repository to further explore its contents in the Repository Explorer itself.

### Decompose the Windows Installer Executable

Note that this documentation describe how the installer without an embedded JRE functions.
It needs to be updated to describe how the JRE is stored as a `*.tar` file that is extracted by the native code.
In any case, the details are reproducible via a local Tycho build.

The Eclipse Installer distribution for the Windows platform is effectively a self-extracting executable.
It is extracted at runtime by the [Bin Extractor](https://github.com/eclipse-oomph/oomph/blob/master/plugins/org.eclipse.oomph.extractor.lib/src/org/eclipse/oomph/extractor/lib/BINExtractor.java).
The pre-built version of this library,
i.e., org.eclipse.oomph.extractor.lib-*.jar,
is available in all Oomph-containing installations,
i.e., in the installer itself and in applications installed by the installer.
This library can also be used stand alone to decompose the composed executable into its constituent parts.
That can be accomplished if you run it with the correct magical program arguments as follows:
```
java -classpath <path-to-extract-lib>\\org.eclipse.oomph.extractor.lib-*.jar
  org.eclipse.oomph.extractor.lib.BINExtractor
  <path-to-executable-to-extract>\\eclipse-inst-win64.exe
  <target-path>\\product.zip
  -export
    <target-path>\\marker.txt
    <target-path>\\extractor.exe
    <target-path>\\org.eclipse.oomph.extractor.lib.jar
    <target-path>\\product-descriptor
```

The Java VM arguments need only specify the extractor library along with the main class in that library.
The first program argument is the location of the executable you wish to decompose, the 64 bit installer in this case.
The remaining arguments are all best directed into a common folder, denoted as <target-path> in the example above.
The second argument is the extracted location of the zip file of the product/distribution.
The third argument is the -export flag. The fourth argument is the extracted location of the text file containing the marker text that is used to delimit the constituent parts of the composed executable.
The fifth argument is the extracted location of the small native executable itself.
The sixth argument is the extracted location of the extractor library, the same one being used to extract the parts.
The seventh and final argument is the extracted location of the product descriptor.
Such a [descriptor](https://github.com/eclipse-oomph/oomph/blob/master/plugins/org.eclipse.oomph.extractor.lib/src/org/eclipse/oomph/extractor/lib/BINDescriptor.java) looks like this:

1
1
7
0
64
0
eclipse-inst.exe
eclipse-inst.ini
Eclipse Installer
http://wiki.eclipse.orgEclipse_Installer.md
http://download.eclipse.org/oomph/jre/128x128.png

Of course you can edit these parts and then you can recompose the executable using the following cmd script executed within the common folder in which you have extracted the constituent parts:
```
COPY /B extractor.exe + ^
  marker.txt +  ^
  org.eclipse.oomph.extractor.lib.jar + ^
  marker.txt +  ^
  product-descriptor + ^
  marker.txt +  ^
  product.zip + ^
  marker.txt  ^
  eclipse-inst-64.exe
```

Our builds use the [postprocess.sh](https://github.com/eclipse-oomph/oomph/blob/master/releng/org.eclipse.oomph.releng/hudson/postprocess.sh) to do this processing.
One issue that's important in terms of signing, is that the extractor.exe that you've extracted above will already contain a signature and this might well cause signing of the composed executable fail.
So our script actually uses the following to fetch the executable from Git:
```
  curl -O curl -O https://github.com/eclipse-oomph/oomph/raw/master/plugins/org.eclipse.oomph.extractor/extractor-64.exe
```

Note that the file names match the extracted target file names.
From this is should be clear that the native executable is just a composition of parts.
This structure is used at runtime as follows.
The extractor.exe runs natively, reading its own executable file, using the marker text to find the parts.
It checks the descriptor to determine if an appropriate version of Java is already installed,
i.e., one that will be able to launch the product; the native extractor consults the registry to find all installed JREs and JVMs.
If an appropriate Java is not found, it opens a browser page prompting the user to install an appropriate Java version with the required bitness and at the minimum required version.
If there is already an appropriate version of Java, it launches a Java process to execute the BinExtract's main method.
That process in turn unzips the product zip to a temp folder and launches the Java process for that for the product/distribution.


## Oomph Configuration Options

### Configuration Options for Installer .ini File

| Option | Description |
| --- | --- |
| **-Doomph.redirection.setups** | Redirects the location of setup files (index, catalog and products). The default URI is [https://raw.githubusercontent.com/eclipse-oomph/oomph/refs/heads/master/setups/](https://raw.githubusercontent.com/eclipse-oomph/oomph/refs/heads/master/setups/) and may be abbreviated with `index:/`. The syntax of the redirection is `index:/-><redirection-URI>/`. Examples: `-Doomph.redirection.setups=index:/->http://<hostname>/<path>/` (external server redirection) or `-Doomph.redirection.setups=index:/->setups/` (path relative to installer executable). See also [Hosting Your Own Index or Catalog](#hosting-your-own-index-or-catalog) |
| **-Doomph.setup.product.catalog.filter** | Only displays product catalogs matching the given prefix.  Displays all catalogs if value is empty. |
| **-Doomph.setup.product.filter** | Only displays products matching the given prefix. Displays all products if value is empty. |
| **-Doomph.setup.product.version.filter** | Only displays product versions matching the given prefix. Displays all product versions if value is empty. |
| **-Doomph.p2.pool** | Set to _@none_ to disable bundle pools. See [\[1\]](https://bugs.eclipse.org/bugs/show_bug.cgi?id=507594) for details. |

## Troubleshooting

### Setup Tasks Do Not Perform

First of all.
Note that the preferences are not set up as part of the installation.
They are setup when the installed eclipse is first started.

To do this the installed product needs to have `eclipse.oomph.setup.feature.group` installed.
The feature is already included in the root of the Eclipse.org Product Catalog.
If you are not using it you can include the same task by yourself:
```
<setup.p2:P2Task
    xmi:version="2.0"
    xmlns:xmi="http://www.omg.org/XMI"
    xmlns:setup.p2="https://www.eclipse.org/oomph/setup/p2/1.0">
  <requirement
      name="org.eclipse.oomph.setup.feature.group"/>
  <repository
      url="${oomph.update.url}"/>
</setup.p2:P2Task>
```
