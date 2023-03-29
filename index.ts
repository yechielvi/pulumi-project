import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path"


const config = new pulumi.Config();

// need to configure dockerhub authentication
const username = config.require("dockerUsername");
const password = config.requireSecret("dockerPassword");


// build and push
const appName = "node-app-" + pulumi.getStack()

const imageName = `${username}/${appName}`;
const registryInfo = {
  server: "docker.io",
  username: username,
  password: password,
};


const image = new docker.Image("my-app", {
  build: {
    context: path.join('node-app', './'), // added because I got some weird bug in windows
  },
  imageName,
  registry: registryInfo,
});

export const baseImageName = image.baseImageName;
export const fullImageName = image.imageName;


// deploy to kubernets

import * as kubernetes from "@pulumi/kubernetes";



const appLabels = {
    app: appName,
};

const webServerDeployment = new kubernetes.apps.v1.Deployment(appName, {
    spec: {
        selector: {
            matchLabels: appLabels,
        },
        template: {
            metadata: {
                labels: appLabels,
            },
            spec: {
                containers: [{
                    image: fullImageName,
                    name: appName,
                }],
            },
        },
    },
});

const webServerService = new kubernetes.core.v1.Service(appName, {
    spec: {
        type: "LoadBalancer",
        ports: [{
            port: 80,
            targetPort: 80,
            protocol: "TCP",
        }],
        selector: appLabels,
    },
});

export const deploymentName = webServerDeployment.metadata.name;
export const ip = webServerService.status.loadBalancer.apply((lb) => lb.ingress[0].ip || lb.ingress[0].hostname)
// now you can get to the app with that ip (/health-check)