MD_DIR=$1
SET=$2
TIME=$3

cp statMetadataHead.sh $MD_DIR
cp print_statMetadataHead.sh $MD_DIR
cp enum_time*.pl $MD_DIR

cd $MD_DIR

./statMetadataHead.sh $SET $TIME
mkdir -p ../stat/
mkdir -p ../stat/MDlist/
mv statMetadata*.txt ../stat/

mv ${SET}*_ID*.txt ../stat/MDlist/

