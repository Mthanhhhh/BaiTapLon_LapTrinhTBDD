param([ValidateSet('integration-v1','domain-commands-v1')][string]$Topic,[ValidateRange(1,1000)][int]$Count=10,[string]$EnvironmentFile='.env.independent.local')
$ErrorActionPreference='Stop'
$command="set -o pipefail; /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic $Topic.DLT --from-beginning --max-messages $Count --timeout-ms 10000 --property print.key=true | /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server kafka:9092 --topic $Topic --property parse.key=true"
& docker compose --env-file $EnvironmentFile -f infra/independent/compose.yml exec -T kafka bash -c $command
if($LASTEXITCODE -ne 0){throw 'Replay incomplete; inspect original cause and retry. Idempotent consumers protect repeated records.'}
