# remove and rerun the same docker container
docker container rm arlene-services-optimize-glb-ktx-api
docker build -t arlene-services-optimize-glb-ktx-api -f DockerfileKTX .