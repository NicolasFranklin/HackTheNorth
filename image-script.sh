#!/bin/bash
while true 
do
	python2.7 tiny_face_eval.py --weight_file_path pickle --data_dir test --output_dir output 
	sleep 300
done
