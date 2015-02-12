SET=$1
TIME=$2

TIME_1D=`./enum_time.pl -g DAY -t $TIME -B 1d | head -1 | sed -e 's/\(....\)\(..\)\(..\)/\1-\2-\3/'`

for fn in `ls ${SET}*_${TIME}*.txt`
do
  echo $fn
  cat $fn | awk '{ print $1 }' | sort | uniq >${fn}_head
  cat $fn | grep $TIME_1D >${fn}_1D
  cat ${fn} | grep $TIME_1D | awk '{ print $1 }' | sort | uniq >${fn}_head_1D
done

CENTRE=`ls ${SET}_*_${TIME}*.txt | cut -d _ -f 2 | sort | uniq`
for c1 in $CENTRE
do
  fn_c1=`ls -r ${SET}_${c1}_${TIME}*_head | head -1`
  fn_c1_1D=`ls -r ${SET}_${c1}_${TIME}*_head_1D | head -1`
  for c2 in $CENTRE
  do
    if [ "$c1" != "$c2" ]
    then
      fn_c2=`ls -r ${SET}_${c2}_${TIME}*_head | head -1`
      fn_c2_1D=`ls -r ${SET}_${c2}_${TIME}*_head_1D | head -1`
      
      echo $fn_c1 '-' $fn_c2
      fn_head_c1_c2=${fn_c1}_${c1}-${c2}
      comm -23 $fn_c1 $fn_c2 >$fn_head_c1_c2
      echo '=' $fn_head_c1_c2
      
      echo $fn_c1_1D '-' $fn_c2_1D
      fn_head_1D_c1_c2=${fn_c1_1D}_${c1}-${c2}
      comm -23 $fn_c1_1D $fn_c2_1D >$fn_head_1D_c1_c2
      echo '=' $fn_head_1D_c1_c2
    fi
  done
done

CENTRE=`ls ${SET}\(deleted\)_*_${TIME}*.txt | cut -d _ -f 2 | sort | uniq`
for c1 in $CENTRE
do
  fn_c1_1D=`ls -r ${SET}\(deleted\)_${c1}_${TIME}*_head_1D | head -1`
  for c2 in $CENTRE
  do
    if [ "$c1" != "$c2" ]
    then
      fn_c2_1D=`ls -r ${SET}\(deleted\)_${c2}_${TIME}*_head_1D | head -1`
      
      echo $fn_c1_1D '-' $fn_c2_1D
      fn_head_1D_c1_c2=${fn_c1_1D}_${c1}-${c2}
      comm -23 $fn_c1_1D $fn_c2_1D >$fn_head_1D_c1_c2
      echo '=' $fn_head_1D_c1_c2
    fi
  done
done

./print_statMetadataHead.sh $SET $TIME >statMetadata_${SET}_${TIME}.txt
