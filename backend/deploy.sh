CONTEXT="home"

echo "Building and starting on remote server"
docker --context "$CONTEXT" compose up -d --build --force-recreate --remove-orphans

echo "done. remote containers: "
docker --context "$CONTEXT" compose ps
