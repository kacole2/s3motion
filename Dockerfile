############################################################
# Dockerfile to start the s3motion REST interface in a container
# Based on Node.js
############################################################

# Set the base image to Ubuntu
FROM dockerfile/nodejs

# File Author / Maintainer
MAINTAINER Kendrick Coleman (kendrickcoleman@gmail.com)

# Update the repository sources list
RUN apt-get update

################## BEGIN INSTALLATION ######################
# Install s3motion
RUN npm install s3motion -g

##################### INSTALLATION END #####################

# Expose the default port 8080
EXPOSE 8080

# Start the REST service
CMD ["--REST"]

# Set default container command
ENTRYPOINT s3motion