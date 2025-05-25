terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~>5" }
  }
  required_version = ">=1.6"
}

provider "aws" { region = var.region }

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~>5"
  name    = "speedconnect"
  cidr    = "10.0.0.0/16"
  azs     = ["${var.region}a", "${var.region}b"]
  public_subnets = ["10.0.1.0/24","10.0.2.0/24"]
}
