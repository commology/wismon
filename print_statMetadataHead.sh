SET=$1

echo $SET TOTAL 'TOTAL(1D)' 'DELETED(1D)'
CENTRE=`ls ${SET}_*_${TIME}*.txt | grep -v _ID | cut -d _ -f 2 | sort | uniq`
for centre in $CENTRE
do
  total=`wc -l ${SET}_${centre}_${TIME}*.txt_head | head -1 | awk '{print $1}'`
  #total_fn="${SET}_${centre}_${TIME}*.txt_head"
  total_fn=`echo ${SET}_${centre}_${TIME}*.txt_head | sed -e 's/head$/ID/' | sed -e 's/_/ /g' | awk '{print $1,$4,$2,$3}' | sed -e 's/ /_/g'`
  total_1D=`wc -l ${SET}_${centre}_${TIME}*.txt_head_1D | head -1 | awk '{print $1}'`
  #total_1D_fn="${SET}_${centre}_${TIME}*.txt_head_1D"
  total_1D_fn=`echo ${SET}_${centre}_${TIME}*.txt_head_1D | sed -e 's/head_1D$/ID-24H/' | sed -e 's/_/ /g' | awk '{print $1,$4,$2,$3}' | sed -e 's/ /_/g'`
  deleted_1D=`wc -l ${SET}\(deleted\)_${centre}_${TIME}*.txt_head_1D | head -1 | awk '{print $1}'`
  #deleted_1D_fn="${SET}\(deleted\)_${centre}_${TIME}*.txt_head_1D"
  deleted_1D_fn=`echo ${SET}\(deleted\)_${centre}_${TIME}*.txt_head_1D | sed -e 's/head_1D$/ID-24H/' | sed -e 's/_/ /g' | awk '{print $1,$4,$2,$3}' | sed -e 's/ /_/g'`
  printf "%s %s[%s] %s[%s] %s[%s]\n" $centre $total $total_fn $total_1D $total_1D_fn $deleted_1D $deleted_1D_fn
done

echo ''

for centre in $CENTRE
do
  printf " %s" $centre
done
printf "\n"

for c1 in $CENTRE
do
  fn=`ls -r ${SET}_${c1}_${TIME}*.txt_head | grep -v _ID | head -1`
  printf "%s" $c1
  for c2 in $CENTRE
  do
    if [ "$c1" != "$c2" ]
    then
      fn_c1_c2=${fn}_${c1}-${c2}
      dif=`wc -l $fn_c1_c2 | head -1 | awk '{print $1}'`
      printf " %s[%s]" $dif $fn_c1_c2
    else
      printf " -[]"
    fi
  done
  printf "\n"
done

echo ''

for centre in $CENTRE
do
  printf " %s" $centre
done
printf "\n"

for c1 in $CENTRE
do
  fn=`ls -r ${SET}_${c1}_${TIME}*.txt_head_1D | grep -v _ID | head -1`
  printf "%s" $c1
  for c2 in $CENTRE
  do
    if [ "$c1" != "$c2" ]
    then
      fn_c1_c2=${fn}_${c1}-${c2}
      dif=`wc -l $fn_c1_c2 | head -1 | awk '{print $1}'`
      printf " %s[%s]" $dif $fn_c1_c2
    else
      printf " -[]"
    fi
  done
  printf "\n"
done

echo ''

for centre in $CENTRE
do
  printf " %s" $centre
done
printf "\n"

for c1 in $CENTRE
do
  fn=`ls -r ${SET}\(deleted\)_${c1}_${TIME}*.txt_head_1D | grep -v _ID | head -1`
  printf "%s" $c1
  for c2 in $CENTRE
  do
    if [ "$c1" != "$c2" ]
    then
      fn_c1_c2=${fn}_${c1}-${c2}
      dif=`wc -l $fn_c1_c2 | head -1 | awk '{print $1}'`
      printf " %s[%s]" $dif $fn_c1_c2
    else
      printf " -[]"
    fi
  done
  printf "\n"
done

for fn in `ls ${SET}_*_${TIME}*.txt_head | grep -v _ID`
do
  new_fn=`echo $fn | sed -e 's/head$/ID/' | sed -e 's/_/ /g' | awk '{print $1,$4,$2,$3}' | sed -e 's/ /_/g'`
  cp $fn $new_fn
done

for fn in `ls ${SET}_*_${TIME}*.txt_head_1D | grep -v _ID`
do
  new_fn=`echo $fn | sed -e 's/head_1D$/ID-24H/' | sed -e 's/_/ /g' | awk '{print $1,$4,$2,$3}' | sed -e 's/ /_/g'`
  cp $fn $new_fn
done

for fn in `ls ${SET}\(deleted\)_*_${TIME}*.txt_head_1D | grep -v _ID`
do
  new_fn=`echo $fn | sed -e 's/head_1D$/ID-24H/' | sed -e 's/_/ /g' | awk '{print $1,$4,$2,$3}' | sed -e 's/ /_/g'`
  cp $fn $new_fn
done

