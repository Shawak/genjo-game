FROM keymetrics/pm2:latest-alpine

# set work dir
ENV DIR /app/server
RUN mkdir -p ${DIR}
WORKDIR ${DIR}

# copy settings
COPY package.json ./
COPY pm2.json ./

# install packages
RUN npm install

# copy files
#COPY . .

# run
CMD ["pm2-docker", "start", "pm2.json"]