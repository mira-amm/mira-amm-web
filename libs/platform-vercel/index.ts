import * as pulumi from "@pulumi/pulumi";
import type {GetProjectResult, GetDeploymentResult} from "@pulumiverse/vercel";
import {PROJECTS, PROJECT_OUTPUTS, DEPLOYMENT_OUTPUTS, table} from "./config";
import chalk from "chalk";

function createHeader(){
  table.push([
    {
      content: chalk.bold.yellowBright("🌐 Project"),
      rowSpan: 2,
      hAlign: "center",
      vAlign: "center",
    },
    {
      content: chalk.bold.bgRedBright.black("🏗 Build Command"),
      rowSpan: 2,
      hAlign: "center",
      vAlign: "center",
    },
    {
      content: chalk.bold.bgYellow.black("📂 Directories"),
      colSpan: 2,
      hAlign: "center",
      vAlign: "center",
    },
    {
      content: chalk.bold.bgBlueBright.black("🛠 Framework"),
      rowSpan: 2,
      hAlign: "center",
      vAlign: "center",
    },
    {
      content: chalk.bold.whiteBright("Project ID"),
      rowSpan: 2,
      hAlign: "center",
      vAlign: "center",
    },
    {
      content: chalk.bold.whiteBright("Domain"),
      rowSpan: 2,
      hAlign: "center",
      vAlign: "center",
    },
  ]);
  table.push([
    {
      content: chalk.bold.bgCyan.black("🛖 Root"),
      hAlign: "center",
      vAlign: "center",
    },
    {
      content: chalk.bold.bgMagenta.black("🚢 Output"),
      hAlign: "center",
      vAlign: "center",
    },
  ]);
};

function createProjectRow(
  project: GetProjectResult,
  projectData: {name: string; emoji: string; domain: string},
){
  return [
    {
      content: `${projectData.emoji} ${chalk.bold.underline.yellow(projectData.name)}`,
    },
    {content: chalk.magentaBright(project.buildCommand ?? "N/A")},
    {content: chalk.blueBright(project.rootDirectory ?? ".")},
    {content: chalk.greenBright(project.outputDirectory ?? "N/A")},
    {content: chalk.blueBright(project.framework ?? "N/A")},
    {content: chalk.white(`'${project.id}'`)},
    {content: chalk.white(`'${projectData.domain}'`)},
  ];
};

pulumi.all(PROJECT_OUTPUTS).apply((projects: GetProjectResult[]) => {
  createHeader();

  const PROJECT_DATA: {[key: string]: Partial<GetProjectResult>} = {};
  const DEPLOYMENT_DATA: {[key: string]: Partial<GetDeploymentResult>} = {};

  projects.forEach((project, index) => {
    const projectData = PROJECTS[index];

    PROJECT_DATA[projectData.name] = {
      name: projectData.name,
      id: project.id,
      buildCommand: project.buildCommand,
      rootDirectory: project.rootDirectory,
      outputDirectory: project.outputDirectory,
      framework: project.framework,
    };

    table.push(createProjectRow(project, projectData));
  });

  const headerRows = table.slice(0, 2);
  const remainingRows = table.slice(2);

  remainingRows.sort((a, b) => {
    const aContent =
      Array.isArray(a) && a[0] && typeof a[0] === "object" && "content" in a[0]
        ? String(a[0].content)
        : "";
    const bContent =
      Array.isArray(b) && b[0] && typeof b[0] === "object" && "content" in b[0]
        ? String(b[0].content)
        : "";

    if (aContent < bContent) return 1;
    if (aContent > bContent) return -1;
    return 0;
  });

  const sortedTable = headerRows.concat(remainingRows);

  console.log(sortedTable.toString());
  console.log(DEPLOYMENT_OUTPUTS);
});
